import "dotenv/config";
import express from "express";
import cors from "cors";
import jdRoutes from "./routes/jdRoutes.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS.");
      error.status = 403;
      return callback(error);
    },
  })
);

app.use(express.json({ limit: "250kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "JD Assistant Groq API",
  });
});

app.use("/api", jdRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error("Backend error:", err.message);
  }

  const safeServerMessages = [
    "Groq rate limit reached. Please wait a moment and try again.",
    "Groq is temporarily busy. Please try again in a moment.",
    "Groq is taking longer than expected. Please try again.",
    "Groq API configuration is missing. Please check your environment variables.",
    "Groq API configuration is missing or invalid. Please check your environment variables.",
    "Something went wrong while contacting Groq. Please try again.",
    "Gemini is temporarily busy. Please try again in a moment.",
    "Gemini is taking longer than expected. Please try again.",
    "Gemini API configuration is missing. Please check your environment variables.",
    "Gemini API configuration is missing or invalid. Please check your environment variables.",
    "Something went wrong while contacting Gemini. Please try again.",
    "Gemini returned an invalid structured response. Please try again.",
  ];

  const message =
    safeServerMessages.includes(err.message)
      ? err.message
      : status >= 500
        ? "Something went wrong on the server. Please try again."
        : err.message;

  res.status(status).json({ error: message });
});

export default app;
