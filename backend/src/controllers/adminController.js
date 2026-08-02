const User = require("../models/User");
const Roadmap = require("../models/Roadmap");
const Quiz = require("../models/Quiz");
const Document = require("../models/Document");
const Note = require("../models/Note");
const Conversation = require("../models/Conversation");

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const [userCount, roadmapCount, quizCount, documentCount, noteCount, conversationCount] = await Promise.all([
      User.countDocuments(),
      Roadmap.countDocuments(),
      Quiz.countDocuments(),
      Document.countDocuments(),
      Note.countDocuments(),
      Conversation.countDocuments(),
    ]);
    res.json({
      success: true,
      stats: { userCount, roadmapCount, quizCount, documentCount, noteCount, conversationCount },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select("name email role xp streak createdAt")
      .sort("-createdAt")
      .limit(200);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You can't delete your own account from here" });
    }
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, listUsers, deleteUser };
