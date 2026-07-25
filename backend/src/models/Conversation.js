const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  { title: String, url: String },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    provider: { type: String, enum: ["groq", "tavily"], default: "groq" },
    sources: [sourceSchema],
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
