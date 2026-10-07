import { generateStructured } from "./aiService.js";
import { buildAnalysisPrompt, buildInterviewPrompt, buildQAPrompt } from "../prompts/jdPrompts.js";

const analysisSchema = {
  type: "object",
  properties: {
    overview: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    facts: { type: "array", items: { type: "object", properties: {
      category: { type: "string" }, statement: { type: "string" }, evidence: { type: "string" },
    }, required: ["category", "statement", "evidence"], additionalProperties: false } },
  }, required: ["overview", "keywords", "facts"], additionalProperties: false,
};
const qaSchema = {
  type: "object",
  properties: {
    answer: { type: "string" }, outOfScope: { type: "boolean" }, grounded: { type: "boolean" },
    evidence: { type: "array", items: { type: "object", properties: {
      text: { type: "string" }, reason: { type: "string" },
    }, required: ["text", "reason"], additionalProperties: false } },
  }, required: ["answer", "outOfScope", "grounded", "evidence"], additionalProperties: false,
};
const interviewItemSchema = {
  type: "object", properties: {
    question: { type: "string" }, reason: { type: "string" }, evidence: { type: "string" },
    suggestedAnswer: { type: "string" }, keyPoints: { type: "array", items: { type: "string" } },
  }, required: ["question", "reason", "evidence", "suggestedAnswer", "keyPoints"], additionalProperties: false,
};
const interviewSchema = {
  type: "object", properties: {
    technical: { type: "array", items: interviewItemSchema },
    behavioral: { type: "array", items: interviewItemSchema },
    roleSpecific: { type: "array", items: interviewItemSchema },
  }, required: ["technical", "behavioral", "roleSpecific"], additionalProperties: false,
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}
function exactEvidenceExists(source, evidence) {
  const normalized = normalizeText(evidence);
  return normalized.length >= 3 && normalizeText(source).includes(normalized);
}
function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function deterministicFacts(jobDescription) {
  const lines = jobDescription.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const facts = [];
  const add = (category, statement, evidence) => {
    if (evidence && exactEvidenceExists(jobDescription, evidence)) facts.push({ category, statement, evidence });
  };
  const titleLabel = /^(?:job\s*title|role(?:\s*title)?|position(?:\s*title)?|title)\s*[:\-–—]\s*(.+)$/i;
  let title = lines.find((line) => titleLabel.test(line));
  title = title ? title.match(titleLabel)?.[1] : lines.find((line) => /\b(developer|engineer|architect|analyst|designer|manager|consultant|administrator|specialist|scientist|director)\b/i.test(line));
  if (title && title.length < 180) {
    add("job_title", `The role is ${title.replace(/[.]$/, "")}.`, title);
    const seniority = title.match(/\b(intern|junior|mid[- ]level|senior|staff|principal|lead|chief|director)\b/i)?.[0];
    if (seniority) add("seniority", `The role is described as ${seniority}.`, seniority);
  }
  const rules = [
    ["experience", /\b\d+\+?\s+years?\b|years?\s+of\s+experience/i],
    ["location", /\b(remote|hybrid|on[- ]site|onsite|within the united states|location)\b/i],
    ["employment_type", /\b(full[- ]time|part[- ]time|contract(?:or)?|temporary|employment type)\b/i],
    ["required_skills", /\b(required|requirements|must have|react(?:\.js)?|typescript|node\.js|express\.js|postgres(?:ql)?|aws)\b/i],
    ["responsibilities", /\b(responsibilit(?:y|ies)|you will|duties include)\b/i],
    ["education", /\b(education|degree|bachelor|master|ph\.?d|certification)\b/i],
    ["preferred_qualifications", /\b(preferred|nice to have|desired qualifications)\b/i],
    ["visa_work_authorization", /\b(visa|sponsor(?:ship)?|work authorization|h[- ]?1b)\b/i],
    ["compensation", /\b(salary|compensation|pay range|benefits|equity)\b/i],
    ["relocation", /\brelocat(?:e|ion|ing)\b/i],
  ];
  for (const line of lines) {
    if (/^(location|required|requirements|preferred qualifications|education|responsibilities|employment type)\s*:?$/i.test(line)) continue;
    for (const [category, regex] of rules) if (regex.test(line)) add(category, line, line);
  }
  return facts;
}

export async function analyzeJD(jobDescription) {
  const raw = await generateStructured({ prompt: buildAnalysisPrompt(jobDescription), schema: analysisSchema, schemaName: "jd_analysis", maxOutputTokens: 1800 });
  const generated = (Array.isArray(raw.facts) ? raw.facts : []).map((fact) => ({
    category: String(fact.category || "").trim(), statement: String(fact.statement || "").trim(), evidence: String(fact.evidence || "").trim(),
  })).filter((fact) => fact.category && fact.statement && exactEvidenceExists(jobDescription, fact.evidence));
  const facts = uniqueBy([...deterministicFacts(jobDescription), ...generated], (fact) => `${normalizeText(fact.statement)}|${normalizeText(fact.evidence)}`);
  if (!facts.length) {
    const error = new Error("I could not build reliable grounded context from this posting. Please check the JD and try again.");
    error.status = 422;
    throw error;
  }
  const keywords = uniqueBy((Array.isArray(raw.keywords) ? raw.keywords : []).map(String).map((item) => item.trim()).filter(Boolean), normalizeText).slice(0, 30);
  return { sourceJD: jobDescription, overview: String(raw.overview || "").trim(), keywords, facts };
}

export function validateClientContext(context) {
  if (!context || !Array.isArray(context.facts) || !context.facts.length) {
    const error = new Error("Please analyze a job description before continuing.");
    error.status = 400;
    throw error;
  }
  const sourceJD = String(context.sourceJD || "").trim();
  if (!sourceJD) {
    const error = new Error("The original job description is missing. Please analyze the JD again.");
    error.status = 400;
    throw error;
  }
  const facts = context.facts.map((fact) => ({
    category: String(fact?.category || "").trim(), statement: String(fact?.statement || "").trim(), evidence: String(fact?.evidence || "").trim(),
  })).filter((fact) => fact.category && fact.statement && exactEvidenceExists(sourceJD, fact.evidence)).slice(0, 180);
  if (!facts.length) {
    const error = new Error("The analyzed job description context is invalid. Please analyze the JD again.");
    error.status = 400;
    throw error;
  }
  return { sourceJD, overview: String(context.overview || "").trim().slice(0, 1500), keywords: Array.isArray(context.keywords) ? context.keywords.map(String).slice(0, 30) : [], facts };
}

function allowedEvidenceSet(context) {
  return new Map(context.facts.map((fact) => [normalizeText(fact.evidence), fact.evidence]));
}
function factAnswer(items, text = (item) => item.evidence) {
  const selected = uniqueBy(items, (item) => normalizeText(item.evidence));
  if (!selected.length) return { answer: "Not stated in this posting.", grounded: false, outOfScope: false, evidence: [] };
  return { answer: selected.map(text).filter(Boolean).join(", "), grounded: true, outOfScope: false, evidence: selected.map((item) => ({ text: item.evidence, reason: "This exact text appears in the job posting." })) };
}
function answerFromFacts(context, question) {
  const q = normalizeText(question);
  const facts = context.facts;
  const category = (name, predicate = () => true) => facts.filter((fact) => fact.category === name && predicate(fact));
  if (/\b(roadmap|syllabus|learning path|complete guide|full guide|tutorial|teach me|how should i prepare|how do i learn|everything i need to know)\b/i.test(q)) return { answer: "That question is outside the job posting. Use Interview Coach for general preparation guidance.", grounded: false, outOfScope: true, evidence: [] };
  if (/\b(role name|job title|position title|what is the role|what's the role)\b/i.test(q)) return factAnswer(category("job_title"), (fact) => fact.statement.replace(/^The role is\s+/i, "").replace(/[.]$/, ""));
  if (/\b(remote|hybrid|onsite|on-site|work arrangement|work location)\b/i.test(q)) return factAnswer(category("location", (fact) => !/^(location|remote|hybrid|onsite)\s*:?$/i.test(fact.evidence)));
  if (/\b(experience|years? of experience|how many years)\b/i.test(q)) return factAnswer(category("experience", (fact) => /\b\d+\+?\s+years?\b/i.test(fact.evidence)));
  if (/\b(h-?1b|visa|sponsor(?:ship)?|work authorization)\b/i.test(q)) return factAnswer(category("visa_work_authorization"));
  if (/\b(salary|compensation|pay|benefits|equity)\b/i.test(q)) return factAnswer(category("compensation"));
  if (/\b(relocat(?:e|ion|ing))\b/i.test(q)) return factAnswer(category("relocation"));
  if (/\b(employment type|full[- ]time|part[- ]time|contract)\b/i.test(q)) return factAnswer(category("employment_type"));
  if (/\b(education|degree|certification)\b/i.test(q)) return factAnswer(category("education"));
  if (/\b(preferred qualifications|nice to have|preferred skills)\b/i.test(q)) return factAnswer(category("preferred_qualifications"));
  if (/\b(technolog(?:y|ies)|skills?|tech stack|frameworks?|programming languages?)\b/i.test(q)) return factAnswer(category("required_skills"));
  return null;
}

export async function answerFromGroundedContext(context, question, history = []) {
  const direct = answerFromFacts(context, question);
  if (direct) return direct;
  const result = await generateStructured({ prompt: buildQAPrompt(context, question, history), schema: qaSchema, schemaName: "jd_qa", maxOutputTokens: 700 });
  if (result.outOfScope) return { answer: "That question is outside the job posting. Use Interview Coach for general preparation guidance.", grounded: false, outOfScope: true, evidence: [] };
  if (!result.grounded) return { answer: "Not stated in this posting.", grounded: false, outOfScope: false, evidence: [] };
  const allowed = allowedEvidenceSet(context);
  const evidence = uniqueBy((Array.isArray(result.evidence) ? result.evidence : []).map((item) => {
    const text = allowed.get(normalizeText(item?.text));
    return text && exactEvidenceExists(context.sourceJD, text) ? { text, reason: String(item?.reason || "").trim() } : null;
  }).filter(Boolean), (item) => normalizeText(item.text));
  if (!evidence.length) return { answer: "Not stated in this posting.", grounded: false, outOfScope: false, evidence: [] };
  return { answer: String(result.answer || "").trim() || "Not stated in this posting.", grounded: true, outOfScope: false, evidence };
}

function validateInterviewItems(items, context, maxItems) {
  const allowed = allowedEvidenceSet(context);
  return uniqueBy((Array.isArray(items) ? items : []).map((item) => {
    const question = String(item?.question || "").trim();
    const reason = String(item?.reason || "").trim();
    const suggestedAnswer = String(item?.suggestedAnswer || "").trim();
    const keyPoints = Array.isArray(item?.keyPoints) ? item.keyPoints.map((point) => String(point || "").trim()).filter(Boolean).slice(0, 6) : [];
    const evidence = allowed.get(normalizeText(item?.evidence));
    if (!question || !reason || !evidence || !exactEvidenceExists(context.sourceJD, evidence) || !suggestedAnswer || !keyPoints.length) return null;
    return { question, reason, evidence, suggestedAnswer, keyPoints };
  }).filter(Boolean), (item) => normalizeText(item.question)).slice(0, maxItems);
}

export async function buildInterviewPrep(context) {
  const result = await generateStructured({ prompt: buildInterviewPrompt(context), schema: interviewSchema, schemaName: "interview_prep", maxOutputTokens: 7500, temperature: 0.25 });
  const clean = (items, limit) => validateInterviewItems(items, context, limit).map(({ question, reason, suggestedAnswer, keyPoints }) => ({ question, reason, suggestedAnswer, keyPoints }));
  return { technical: clean(result.technical, 5), behavioral: clean(result.behavioral, 4), roleSpecific: clean(result.roleSpecific, 4) };
}
