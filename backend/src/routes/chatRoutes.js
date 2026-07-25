const express = require("express");
const {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendMessage,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:id", getConversation);
router.delete("/conversations/:id", deleteConversation);
router.post("/conversations/:id/messages", sendMessage);

module.exports = router;
