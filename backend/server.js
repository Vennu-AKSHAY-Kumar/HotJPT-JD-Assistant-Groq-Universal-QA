import "dotenv/config";
import app from "./src/app.js";

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`JD Assistant Groq backend running on http://localhost:${port}`);
});
