import Groq from "groq-sdk";

const DEFAULT_MODEL = "qwen/qwen3.8-27b";
const TIMEOUT_MS = 45000;

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Groq API configuration is missing. Please check your environment variables."
    );
    error.status = 500;
    error.provider = "groq";
    throw error;
  }

  return new Groq({ apiKey });
}

function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(
        "Groq is taking longer than expected. Please try again."
      );
      error.status = 504;
      error.provider = "groq";
      error.retryable = true;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function recoverPartialAnswer(content) {
  const keyIndex = content.indexOf('"answer"');
  if (keyIndex < 0) return "";

  const valueStart = content.indexOf('"', content.indexOf(":", keyIndex) + 1);
  if (valueStart < 0) return "";

  let escaped = false;
  let raw = "";
  for (let index = valueStart + 1; index < content.length; index += 1) {
    const character = content[index];
    if (escaped) {
      raw += `\\${character}`;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      break;
    } else {
      raw += character;
    }
  }

  try {
    return JSON.parse(`"${raw}${escaped ? "\\\\" : ""}"`);
  } catch {
    return raw.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
  }
}

function mapGroqError(error) {
  if (error?.provider === "groq") return error;

  const status =
    Number(error?.status) ||
    Number(error?.statusCode) ||
    Number(error?.response?.status) ||
    0;

  let message = "";
  try {
    message =
      typeof error?.message === "string"
        ? error.message
        : JSON.stringify(error || {});
  } catch {
    message = String(error || "");
  }

  const normalized = message.toLowerCase();

  if (
    status === 429 ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("quota")
  ) {
    const rateError = new Error(
      "Groq rate limit reached. Please wait a moment and try again."
    );
    rateError.status = 429;
    rateError.provider = "groq";
    rateError.retryable = true;
    return rateError;
  }

  if (
    status === 503 ||
    normalized.includes("service unavailable") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("overloaded")
  ) {
    const busyError = new Error(
      "Groq is temporarily busy. Please try again in a moment."
    );
    busyError.status = 503;
    busyError.provider = "groq";
    busyError.retryable = true;
    return busyError;
  }

  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("invalid api key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("authentication")
  ) {
    const configError = new Error(
      "Groq API configuration is missing or invalid. Please check your environment variables."
    );
    configError.status = 500;
    configError.provider = "groq";
    return configError;
  }

  console.error("Groq request failed:", message);

  const safeError = new Error(
    "Something went wrong while contacting Groq. Please try again."
  );
  safeError.status = status >= 400 ? status : 502;
  safeError.provider = "groq";
  safeError.retryable = status >= 500;
  return safeError;
}

export async function generateGroqStructured({
  prompt,
  schema,
  schemaName = "response",
  maxOutputTokens = 4096,
  temperature = 0.1,
  includeMetadata = false,
}) {
  const groq = getClient();
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const completion = await withTimeout(
      groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_completion_tokens: maxOutputTokens,
        reasoning_effort: "none",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
      })
    );

    const content = completion?.choices?.[0]?.message?.content;
    const finishReason = completion?.choices?.[0]?.finish_reason || null;
    const usage = completion?.usage || null;

    if (includeMetadata) {
      console.info("Groq completion:", {
        finish_reason: finishReason,
        completion_tokens: usage?.completion_tokens ?? null,
        prompt_tokens: usage?.prompt_tokens ?? null,
        total_tokens: usage?.total_tokens ?? null,
      });
    }

    if (!content) {
      const error = new Error("Groq returned an empty response.");
      error.status = 502;
      error.provider = "groq";
      throw error;
    }

    try {
      const data = JSON.parse(content);
      return includeMetadata ? { data, finishReason, usage } : data;
    } catch {
      if (includeMetadata && finishReason === "length") {
        return {
          data: { answer: recoverPartialAnswer(content) },
          finishReason,
          usage,
        };
      }

      const error = new Error(
        "Groq returned an invalid structured response. Please try again."
      );
      error.status = 502;
      error.provider = "groq";
      throw error;
    }
  } catch (error) {
    throw mapGroqError(error);
  }
}
