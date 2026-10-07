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

export function classifyCoachQuestion(message) {
  const text = String(message || "").toLowerCase();
  const jobSpecificPatterns = [
    /\b(?:this|the|about this)\s+(?:job|role|position|posting|company|employer|job description|jd)\b/,
    /\b(?:job title|role name|position title)\b/,
    /\b(?:what|which|how many)\b.{0,50}\b(?:this role|this position|this job|the posting|the jd)\b/,
    /\b(?:sponsor|sponsorship|h-?1b|visa|remote|hybrid|onsite|on-site)\b.{0,50}\b(?:company|job|role|position|posting|jd)\b/,
  ];

  return jobSpecificPatterns.some((pattern) => pattern.test(text))
    ? "JOB_SPECIFIC_FACT"
    : "GENERAL_COACHING_OR_TECHNICAL";
}

export async function coachInterview({ context, message, history }) {
  const safeHistory = sanitizeHistory(history);
  const questionType = classifyCoachQuestion(message);

  const completion = await generateStructured({
    prompt: buildInterviewCoachPrompt({
      context,
      message: String(message).slice(0, 6000),
      history: safeHistory,
      questionType,
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
