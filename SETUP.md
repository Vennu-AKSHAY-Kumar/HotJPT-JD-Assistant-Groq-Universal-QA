# Detailed Setup & Run — Groq Edition

## Step 1 — Extract and open

Extract `HotJPT-JD-Assistant-Groq.zip` and open the folder in VS Code.

## Step 2 — Check Node.js

Use Node.js 20 or newer:

```powershell
node --version
npm --version
```

## Step 3 — Create a Groq API key

1. Open GroqCloud Console.
2. Sign in.
3. Open **API Keys**.
4. Create a new API key.
5. Copy it.
6. Keep it backend-only.

## Step 4 — Install backend

Terminal 1:

```powershell
cd backend
npm install
```

## Step 5 — Create `backend/.env`

Copy `.env.example` to `.env`.

Use:

```env
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_REAL_GROQ_API_KEY
GROQ_MODEL=qwen/qwen3.8-27b

ENABLE_GEMINI_FALLBACK=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash

FRONTEND_URL=http://localhost:5173
PORT=3001
```

For normal Groq-only usage, leave `GEMINI_API_KEY` blank.

## Step 6 — Run backend

```powershell
npm run dev
```

Expected:

```text
JD Assistant Groq backend running on http://localhost:3001
```

Health:

```text
http://localhost:3001/api/health
```

Expected:

```json
{
  "ok": true,
  "service": "JD Assistant Groq API"
}
```

### If port 3001 is busy

```powershell
netstat -ano | findstr :3001
taskkill /PID YOUR_PID /F
```

Then run `npm run dev` again.

## Step 7 — Install frontend

Terminal 2:

```powershell
cd frontend
npm install
```

## Step 8 — Run frontend

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

## Step 9 — Test

1. Paste a JD.
2. Analyze it.
3. Ask `Is this role remote?`
4. Ask something absent.
5. Confirm `Not stated in this posting.`
6. Open Interview Prep.
7. Generate questions.
8. Open Suggested Answer.
9. Check Key Points.
10. Click Ask Coach.
11. Ask `Make this answer more senior-level.`

## Step 10 — Optional Gemini fallback

Enable only if wanted:

```env
ENABLE_GEMINI_FALLBACK=true
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
```

Restart backend.

## Step 11 — Friendly Groq errors

429:

```text
Groq rate limit reached. Please wait a moment and try again.
```

Temporary outage:

```text
Groq is temporarily busy. Please try again in a moment.
```

## Step 12 — Push to GitHub

From project root:

```powershell
git init
git add .
git status
```

Confirm `backend/.env` is NOT staged.

Then:

```powershell
git commit -m "HotJPT JD Assistant with Groq"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Step 13 — Deploy backend to Vercel

Create a Vercel project.

Root Directory:

```text
backend
```

Environment variables:

```text
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_REAL_GROQ_KEY
GROQ_MODEL=qwen/qwen3.8-27b
ENABLE_GEMINI_FALLBACK=false
FRONTEND_URL=*
```

Deploy and test:

```text
https://YOUR-BACKEND.vercel.app/api/health
```

## Step 14 — Deploy frontend to Vercel

Create a second Vercel project.

Root Directory:

```text
frontend
```

Add:

```text
VITE_API_URL=https://YOUR-BACKEND.vercel.app
```

Deploy.

## Step 15 — Lock down CORS

After frontend deployment, change backend:

```text
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
```

Redeploy backend.

## Step 16 — Final production test

Test:
- Analyze JD
- Grounded Q&A
- Unsupported question
- Interview Prep
- Suggested Answer
- Key Points
- Ask Coach
- Follow-up chat
- Markdown formatting
