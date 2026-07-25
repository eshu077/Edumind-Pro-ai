const Note = require("../models/Note");
const Document = require("../models/Document");
const groq = require("../config/groq");

const NOTE_MODEL = "llama-3.3-70b-versatile";
const VALID_FORMATS = ["notes", "cheatsheet", "summary", "flashcards", "mind_map", "interview_questions"];

const FORMAT_INSTRUCTIONS = {
  notes:
    "Write clear, well-structured study notes in markdown — use headings, bullet points, and bold key terms. Thorough but scannable.",
  cheatsheet:
    "Create a compact cheat sheet in markdown — key facts, formulas, or syntax as tight bullet points and tables where useful. Prioritize density over prose.",
  summary: "Write a concise summary in markdown, roughly 300-500 words, capturing the essential points.",
  mind_map:
    "Create a hierarchical mind-map outline as nested markdown bullet points — main branches as top-level bullets, sub-topics nested underneath (up to 3 levels deep). No prose, just the outline.",
  interview_questions:
    "Generate 10 to 15 realistic interview questions with concise model answers, formatted in markdown as a numbered list (question in bold, answer just below it).",
};

function stripCodeFences(text) {
  return text.replace(/^```(markdown|json)?/i, "").replace(/```$/i, "").trim();
}

// If a document is given, pull its extracted text (capped) as grounding
// context. Best-effort — a missing/unready document just means no context.
async function buildContextPrefix(documentId, userId) {
  if (!documentId) return "";
  const doc = await Document.findOne({ _id: documentId, user: userId, status: "ready" });
  if (!doc) return "";
  const text = doc.chunks.map((c) => c.text).join(" ").slice(0, 6000);
  return `Base this primarily on the following source material (an excerpt from "${doc.originalName}"):\n\n${text}\n\n---\n\n`;
}

// POST /api/notes  { topic, format, documentId? }
async function createNote(req, res, next) {
  try {
    const { topic, format, documentId } = req.body;
    if (!topic || !format) {
      return res.status(400).json({ success: false, message: "topic and format are required" });
    }
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ success: false, message: "Invalid format" });
    }

    const note = await Note.create({
      user: req.user._id,
      topic,
      format,
      sourceDocument: documentId || null,
      status: "generating",
    });

    res.status(202).json({ success: true, note: note.toSummary() });

    try {
      const contextPrefix = await buildContextPrefix(documentId, req.user._id);

      if (format === "flashcards") {
        const completion = await groq.chat.completions.create({
          model: NOTE_MODEL,
          messages: [
            {
              role: "user",
              content: `${contextPrefix}Generate 10 to 20 flashcards on "${topic}" as a single valid JSON object — no markdown fences, no commentary.
Schema: { "title": string, "flashcards": [ { "front": string, "back": string } ] }
Return ONLY the JSON object.`,
            },
          ],
          temperature: 0.5,
          response_format: { type: "json_object" },
        });

        const raw = completion.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(stripCodeFences(raw));
        const flashcards = (Array.isArray(parsed.flashcards) ? parsed.flashcards : [])
          .map((f) => ({ front: String(f.front || ""), back: String(f.back || "") }))
          .filter((f) => f.front && f.back);

        if (flashcards.length === 0) throw new Error("No usable flashcards were generated");

        note.title = String(parsed.title || `${topic} Flashcards`);
        note.flashcards = flashcards;
        note.status = "ready";
        await note.save();
      } else {
        const instruction = FORMAT_INSTRUCTIONS[format];
        const completion = await groq.chat.completions.create({
          model: NOTE_MODEL,
          messages: [
            {
              role: "user",
              content: `${contextPrefix}Topic: "${topic}"\n\n${instruction}\n\nStart with a single "# " markdown title line, then the content. Return only markdown — no commentary before or after it.`,
            },
          ],
          temperature: 0.5,
        });

        const raw = completion.choices?.[0]?.message?.content || "";
        const content = stripCodeFences(raw);
        if (!content.trim()) throw new Error("No content was generated");

        const titleMatch = content.match(/^#\s+(.+)$/m);
        note.title = titleMatch ? titleMatch[1].trim() : topic;
        note.content = content;
        note.status = "ready";
        await note.save();
      }
    } catch (genErr) {
      console.error("Note generation failed:", genErr);
      note.status = "failed";
      note.errorMessage = "Couldn't generate this — try again, or adjust the topic.";
      await note.save();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/notes
async function listNotes(req, res, next) {
  try {
    const notes = await Note.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, notes: notes.map((n) => n.toSummary()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/:id
async function getNote(req, res, next) {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:id
async function deleteNote(req, res, next) {
  try {
    const result = await Note.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createNote, listNotes, getNote, deleteNote };
