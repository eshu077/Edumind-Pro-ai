const Document = require("../models/Document");
const { extractText, getExtension } = require("../utils/extractText");
const { chunkText } = require("../utils/chunker");
const { embedBatch, embedText, cosineSimilarity } = require("../utils/embeddings");
const groq = require("../config/groq");

const TOP_K = 6;
const RAG_MODEL = "llama-3.3-70b-versatile";

const RAG_SYSTEM_PROMPT = `You are EduMind Pro AI's document assistant. Answer the user's question using ONLY
the numbered context excerpts below, taken from documents they uploaded. Cite the excerpt number inline like
[1], [2] for every claim you make. If the excerpts don't contain enough to answer, say clearly that the uploaded
documents don't cover it — never fall back on outside knowledge for this mode.`;

function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /api/documents  (multipart, field name "file")
async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const doc = await Document.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileType: getExtension(req.file.originalname),
      sizeBytes: req.file.size,
      status: "processing",
    });

    // Respond right away so the UI can show "processing" — extraction and
    // embedding happen in the background and the client polls for status.
    res.status(202).json({ success: true, document: doc.toSummary() });

    try {
      const rawText = await extractText(req.file.buffer, req.file.originalname);
      if (!rawText || !rawText.trim()) {
        throw new Error("No extractable text was found in this file.");
      }

      const chunks = chunkText(rawText);
      if (chunks.length === 0) {
        throw new Error("This file's text was too short to build a knowledge base from.");
      }

      const embeddings = await embedBatch(chunks);

      doc.chunks = chunks.map((text, i) => ({ text, embedding: embeddings[i], chunkIndex: i }));
      doc.chunkCount = chunks.length;
      doc.status = "ready";
      await doc.save();
    } catch (processErr) {
      console.error("Document processing failed:", processErr);
      doc.status = "failed";
      doc.errorMessage = processErr.message;
      await doc.save();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/documents
async function listDocuments(req, res, next) {
  try {
    const docs = await Document.find({ user: req.user._id }).select("-chunks").sort("-createdAt");
    res.json({ success: true, documents: docs.map((d) => d.toSummary()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:id  (used for polling processing status)
async function getDocument(req, res, next) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id }).select("-chunks");
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true, document: doc.toSummary() });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documents/:id
async function deleteDocument(req, res, next) {
  try {
    const result = await Document.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/ask  { documentIds: string[], question: string }  — streams over SSE
async function askDocuments(req, res) {
  const { documentIds, question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: "Question is required" });
  }
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({ success: false, message: "Select at least one document" });
  }

  const docs = await Document.find({
    _id: { $in: documentIds },
    user: req.user._id,
    status: "ready",
  });

  if (docs.length === 0) {
    return res.status(404).json({ success: false, message: "No ready documents found for those IDs" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  try {
    const questionEmbedding = await embedText(question);

    // Brute-force cosine similarity across every chunk in the selected
    // documents. Fine for a personal study library; if this needs to scale
    // to thousands of documents, swap this loop for Atlas Vector Search.
    const scored = [];
    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        scored.push({
          score: cosineSimilarity(questionEmbedding, chunk.embedding),
          text: chunk.text,
          documentName: doc.originalName,
          chunkIndex: chunk.chunkIndex,
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_K);

    if (top.length === 0) {
      sseWrite(res, "error", { message: "The selected documents don't have any indexed content yet." });
      return res.end();
    }

    const sources = top.map((t, i) => ({ index: i + 1, documentName: t.documentName, chunkIndex: t.chunkIndex }));
    sseWrite(res, "sources", { sources });

    const context = top.map((t, i) => `[${i + 1}] (from "${t.documentName}")\n${t.text}`).join("\n\n");
    const systemPrompt = `${RAG_SYSTEM_PROMPT}\n\nContext:\n${context}`;

    const stream = await groq.chat.completions.create({
      model: RAG_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      stream: true,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (token) sseWrite(res, "token", { text: token });
    }

    sseWrite(res, "done", {});
  } catch (err) {
    console.error("RAG stream error:", err);
    sseWrite(res, "error", { message: err.message || "Something went wrong answering from your documents." });
  } finally {
    res.end();
  }
}

module.exports = { uploadDocument, listDocuments, getDocument, deleteDocument, askDocuments };
