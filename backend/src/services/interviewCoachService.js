import { generateStructured } from "./aiService.js";
import { buildInterviewCoachPrompt } from "../prompts/interviewCoachPrompt.js";

const coachSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
  },
  required: ["answer"],
  additionalProperties: false,
};

function sanitizeHistory(history) {
  return history
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").trim().slice(0, 5000),
    }))
    .filter((item) => item.content)
    .slice(-8);
}

export async function coachInterview({ context, message, history }) {
  const safeHistory = sanitizeHistory(history);

  const completion = await generateStructured({
    prompt: buildInterviewCoachPrompt({
      context,
      message: String(message).slice(0, 6000),
      history: safeHistory,
    }),
    schema: coachSchema,
    schemaName: "interview_coach",
    maxOutputTokens: 2500,
    temperature: 0.35,
    includeMetadata: true,
  });

  const answer = String(completion.data?.answer || "").trim();

  if (!answer) {
    const error = new Error(
      "The AI provider returned an invalid response. Please try again."
    );
    error.status = 502;
    throw error;
  }

  return { answer };
}
