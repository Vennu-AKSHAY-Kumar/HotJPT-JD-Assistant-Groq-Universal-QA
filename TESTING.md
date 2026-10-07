# Manual Testing — Groq Edition

1. `/api/health` works.
2. Valid JD analyzes.
3. Grounded Q&A shows evidence.
4. Unsupported question returns exactly `Not stated in this posting.`
5. Interview Prep shows Technical / Behavioral / Role-Specific.
6. Each interview item has Question / Why / Suggested Answer / Key Points.
7. Suggested answers do not invent candidate experience.
8. Ask Coach works.
9. Follow-up chat remembers recent context.
10. Markdown renders bold text and lists correctly.
11. Invalid Groq key shows a safe configuration error.
12. Groq 429 shows `Groq rate limit reached. Please wait a moment and try again.`
13. Gemini fallback disabled means Gemini is never called.
14. Gemini fallback enabled allows one fallback attempt on temporary Groq failures.
15. Mobile layout remains usable.


## Universal Q&A tests

- Ask `What is the role name?` → should answer from JD context.
- Ask `Explain React hooks.` → should answer using general knowledge.
- Ask a follow-up like `Give me an example.` → should use recent Q&A context.
- Ask `Does this company sponsor H-1B?` when absent → should return `Not stated in this posting.`
