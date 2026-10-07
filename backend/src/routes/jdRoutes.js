import { Router } from "express";
import {
  analyzeJobDescription,
  answerQuestion,
  generateInterviewPrep,
  interviewChat,
} from "../controllers/jdController.js";

const router = Router();

router.post("/analyze", analyzeJobDescription);
router.post("/qa", answerQuestion);
router.post("/interview-prep", generateInterviewPrep);
router.post("/interview-chat", interviewChat);

export default router;
