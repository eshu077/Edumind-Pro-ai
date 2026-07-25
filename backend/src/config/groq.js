const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
  console.warn(
    "[EduMind Pro AI] GROQ_API_KEY is not set — the AI Tutor will return errors until you add it to backend/.env."
  );
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing-key" });

module.exports = groq;
