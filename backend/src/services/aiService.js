import { generateGroqStructured } from "./groqService.js";
import { generateGeminiStructured } from "./geminiService.js";

function fallbackEnabled() {
  return (
    String(process.env.ENABLE_GEMINI_FALLBACK || "false").toLowerCase() ===
      "true" &&
    Boolean(process.env.GEMINI_API_KEY)
  );
}

function shouldFallback(error) {
  return (
    error?.provider === "groq" &&
    [429, 502, 503, 504].includes(Number(error?.status))
  );
}

export async function generateStructured(options) {
  const provider = String(process.env.AI_PROVIDER || "groq").toLowerCase();

  if (provider === "gemini") {
    const result = await generateGeminiStructured(options);
    return options.includeMetadata
      ? { data: result, finishReason: null, usage: null }
      : result;
  }

  if (provider !== "groq") {
    const error = new Error(
      `Unsupported AI_PROVIDER "${provider}". Use "groq" or "gemini".`
    );
    error.status = 500;
    throw error;
  }

  try {
      return await generateGroqStructured(options);
  } catch (error) {
    if (fallbackEnabled() && shouldFallback(error)) {
      console.warn(
        `Groq unavailable (${error.status || "unknown"}). Trying Gemini fallback once.`
      );

      try {
        const result = await generateGeminiStructured(options);
        return options.includeMetadata
          ? { data: result, finishReason: null, usage: null }
          : result;
      } catch (fallbackError) {
        console.error(
          "Gemini fallback also failed:",
          fallbackError?.message || fallbackError
        );
      }
    }

    throw error;
  }
}
