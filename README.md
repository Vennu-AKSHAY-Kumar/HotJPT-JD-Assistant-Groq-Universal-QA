# HotJPT JD Assistant

## Problem

Candidates need to understand a job posting, prepare for likely interviews, and distinguish requirements actually stated by the employer from general advice.

## Solution

Paste a job description once. The backend analyzes it into a validated shared context. The primary Q&A answers only from that context and displays supporting JD evidence. Interview Prep uses the same context to generate focused questions. Interview Coach adds broader technical and interview guidance while grounding job-specific claims in the posting.

## Features

- Strict, evidence-backed JD Q&A.
- Exact fallback for absent job facts: `Not stated in this posting.`
- Technical, Behavioral, and Role-Specific interview questions with JD-specific reasons.
- Suggested answers, key points, expandable answer cards, and Ask Coach actions.
- Interview Coach for general technical questions, roadmaps, career guidance, STAR answers, answer reviews, and follow-ups.
- Concise-complete guidance for broad Interview Coach requests.
- Groq as the primary provider with optional Gemini fallback.
- Responsive React UI, Markdown rendering, and Vercel-compatible deployment.

## Architecture

```text
Original JD
  -> one analysis / grounding engine
  -> validated shared context and evidence
  -> strict grounded Q&A + Interview Prep
  -> Interview Coach as an additional JD-aware/general coaching enhancement
```

The frontend retains the context in memory and sends it to the Express API. `aiService.js` selects Groq or an enabled Gemini fallback. `groundingService.js` analyzes and validates JD facts, answers grounded questions, and generates interview preparation. `interviewCoachService.js` handles broader coaching with the same validated context.

## Grounding Approach

The original JD is retained in the shared context. Extracted evidence is checked against the source text before it is accepted or shown. Job-specific Q&A uses only validated facts and never answers from general model knowledge. Supported factual answers include exact evidence from the posting. Unsupported job facts return exactly:

`Not stated in this posting.`

General requests in the strict Q&A panel are directed to Interview Coach. Interview Coach may use general knowledge, but must source facts about the specific role from the validated JD.

## Assumptions

- Normal job postings fit comfortably in the model context window.
- No database or server-side session persistence is required for this take-home.
- Candidate personal history is unknown unless the candidate supplies it.
- Job-specific claims must be supported by explicit posting text.

## Tradeoffs

- A compact validated context is used instead of a vector database because standard-length postings are small enough to analyze once.
- Conversation history lives in frontend memory rather than a database.
- Groq is the primary provider for practical development speed and free testing; Gemini remains an optional fallback.
- The project avoids an over-engineered retrieval stack for ordinary job descriptions.

## Error Handling

The backend maps Groq rate limits (429), provider busy/unavailable responses, timeouts, invalid API keys, and malformed structured output to safe user-facing messages. Raw provider details are logged by the backend when useful and are not returned to the UI. Gemini fallback is optional and can be enabled for temporary Groq failures.

## What I Would Improve With More Time

- Resume upload and likely skill-gap analysis.
- Automated unit and integration tests.
- Streaming responses.
- Chunking and retrieval for unusually long job descriptions.
- Authentication and persistence if the project becomes a product.
- Better request tracing and observability.

## How I Used AI Tools

I used ChatGPT/Codex to assist with implementation, debugging, prompt refinement, and code review. I reviewed and tested the generated code and can explain the architecture and decisions.

## Local Setup

Requirements: Node.js 20 or newer.

Backend terminal:

```powershell
cd backend
npm install
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is `http://localhost:3001/api/health`.

## Environment Variables

Create `backend/.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=qwen/qwen3.8-27b
ENABLE_GEMINI_FALLBACK=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Set `ENABLE_GEMINI_FALLBACK=true` and provide `GEMINI_API_KEY` to enable the optional fallback. Keep provider keys backend-only.

## Deployment

The frontend and backend are Vercel-ready as separate projects. Set the backend root directory to `backend` and frontend root directory to `frontend`. Configure the backend environment variables in Vercel, set `FRONTEND_URL` to the deployed frontend origin, and set frontend `VITE_API_URL` to the deployed backend URL. See `SETUP.md` for detailed deployment steps.
