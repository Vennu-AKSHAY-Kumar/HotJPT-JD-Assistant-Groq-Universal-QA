import {
  analyzeJD,
  answerFromGroundedContext,
  buildInterviewPrep,
  validateClientContext,
} from "../services/groundingService.js";
import { coachInterview } from "../services/interviewCoachService.js";

const MIN_JD_LENGTH = 80;

export async function analyzeJobDescription(req, res, next) {
  try {
    const jobDescription = String(req.body?.jobDescription || "").trim();

    if (!jobDescription) {
      return res
        .status(400)
        .json({ error: "Please paste a job description before continuing." });
    }

    if (jobDescription.length < MIN_JD_LENGTH) {
      return res.status(400).json({
        error:
          "This job description looks too short. Please paste the full posting.",
      });
    }

    const context = await analyzeJD(jobDescription);

    return res.json({
      message: "Job description analyzed.",
      context,
    });
  } catch (error) {
    next(error);
  }
}

export async function answerQuestion(req, res, next) {
  try {
    const question = String(req.body?.question || "").trim();

    if (!question) {
      return res.status(400).json({ error: "Please enter a question." });
    }

    const context = validateClientContext(req.body?.context);
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    const result = await answerFromGroundedContext(context, question, history);

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function generateInterviewPrep(req, res, next) {
  try {
    const context = validateClientContext(req.body?.context);
    const result = await buildInterviewPrep(context);

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function interviewChat(req, res, next) {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Please enter a message for the Interview Coach.",
      });
    }

    const context = validateClientContext(req.body?.context);
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    const result = await coachInterview({
      context,
      message,
      history,
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
}
