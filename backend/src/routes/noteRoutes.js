const express = require("express");
const { protect } = require("../middleware/auth");
const { createNote, listNotes, getNote, deleteNote } = require("../controllers/noteController");

const router = express.Router();

router.use(protect);

router.post("/", createNote);
router.get("/", listNotes);
router.get("/:id", getNote);
router.delete("/:id", deleteNote);

module.exports = router;
