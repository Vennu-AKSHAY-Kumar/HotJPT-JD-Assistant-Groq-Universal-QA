import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 30000;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Gemini API configuration is missing. Please check your environment variables."
    );
    error.status = 500;
    throw error;
  }

  return new GoogleGenAI({ apiKey });
}

function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(
        "Gemini is taking longer than expected. Please try again."
      );
      error.status = 504;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function mapGeminiError(error) {
  const status =
    Number(error?.status) ||
    Number(error?.code) ||
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
    status === 503 ||
    normalized.includes('"code":503') ||
    normalized.includes('"status":"unavailable"') ||
    normalized.includes("high demand") ||
    normalized.includes("service unavailable") ||
    normalized.includes("temporarily unavailable")
  ) {
    const busyError = new Error(
      "Gemini is temporarily busy. Please try again in a moment."
    );
    busyError.status = 503;
    return busyError;
  }

  if (
    status === 504 ||
    normalized.includes("taking longer than expected")
  ) {
    const timeoutError = new Error(
      "Gemini is taking longer than expected. Please try again."
    );
    timeoutError.status = 504;
    return timeoutError;
  }

  if (
    normalized.includes("api key") &&
    (
      normalized.includes("missing") ||
      normalized.includes("invalid") ||
      normalized.includes("unauthorized") ||
      normalized.includes("permission")
    )
  ) {
    const configError = new Error(
      "Gemini API configuration is missing or invalid. Please check your environment variables."
    );
    configError.status = 500;
    return configError;
  }

  if (error?.status && error?.message) {
    return error;
  }

  console.error("Gemini request failed:", message);

  const safeError = new Error(
    "Something went wrong while contacting Gemini. Please try again."
  );
  safeError.status = 502;
  return safeError;
}

export async function generateGeminiStructured({
  prompt,
  schema,
  maxOutputTokens = 4096,
  temperature = 0.1,
}) {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      })
    );

    if (!response?.text) {
      const error = new Error("Gemini returned an empty response.");
      error.status = 502;
      throw error;
    }

    try {
      return JSON.parse(response.text);
    } catch {
      const error = new Error(
        "Gemini returned an invalid structured response. Please try again."
      );
      error.status = 502;
      throw error;
    }
  } catch (error) {
    throw mapGeminiError(error);
  }
}
