const Conversation = require("../models/Conversation");
const groq = require("../config/groq");
const { tavilySearch } = require("../utils/tavily");
const { decideProvider } = require("../utils/providerRouter");

const CHAT_MODEL = "llama-3.3-70b-versatile";
const HISTORY_WINDOW = 20; // most recent messages sent for context

const TUTOR_SYSTEM_PROMPT = `You are the AI Tutor inside EduMind Pro AI, a friendly, precise study assistant.
Explain concepts clearly and adapt to how advanced the question sounds. Use markdown where it genuinely
helps: headings, bullet points, fenced code blocks with a language tag, and tables for comparisons.
Keep answers focused — don't pad with unnecessary preamble or repetition.`;

const TAVILY_SYSTEM_PROMPT = `You are the AI Tutor inside EduMind Pro AI. You've been given fresh web search
results below because the question needs current information. Answer using the information in these results
plus your own reasoning. Cite sources inline like [1], [2], matching the numbered list. If the results don't
fully answer the question, say so plainly instead of guessing.`;

function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// GET /api/chat/conversations
async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .select("title createdAt updatedAt")
      .sort("-updatedAt")
      .limit(100);
    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
}

// POST /api/chat/conversations
async function createConversation(req, res, next) {
  try {
    const conversation = await Conversation.create({ user: req.user._id, title: "New chat", messages: [] });
    res.status(201).json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/conversations/:id
async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    res.json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/chat/conversations/:id
async function deleteConversation(req, res, next) {
  try {
    const result = await Conversation.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/chat/conversations/:id/messages  — streams the reply over SSE
async function sendMessage(req, res) {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Message content is required" });
  }

  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  conversation.messages.push({ role: "user", content });
  if (conversation.messages.length === 1) {
    conversation.title = content.slice(0, 60);
  }
  await conversation.save();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const provider = decideProvider(content);
  sseWrite(res, "provider", { provider });

  let systemPrompt = TUTOR_SYSTEM_PROMPT;
  let sources = [];

  try {
    if (provider === "tavily") {
      const results = await tavilySearch(content);
      sources = results.map((r) => ({ title: r.title, url: r.url }));
      const context = results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
        .join("\n\n");
      systemPrompt = `${TAVILY_SYSTEM_PROMPT}\n\nSearch results:\n${context || "(no results found)"}`;
      sseWrite(res, "sources", { sources });
    }

    const history = conversation.messages.slice(-HISTORY_WINDOW).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      stream: true,
      temperature: 0.4,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (token) {
        fullText += token;
        sseWrite(res, "token", { text: token });
      }
    }

    conversation.messages.push({ role: "assistant", content: fullText, provider, sources });
    await conversation.save();

    sseWrite(res, "done", { conversationId: conversation._id, title: conversation.title });
  } catch (err) {
    console.error("Chat stream error:", err);
    sseWrite(res, "error", { message: err.message || "Something went wrong generating a response." });
  } finally {
    res.end();
  }
}

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendMessage,
};
