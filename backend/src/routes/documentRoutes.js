const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  askDocuments,
} = require("../controllers/documentController");

const router = express.Router();

router.use(protect);

router.post("/", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.post("/ask", askDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
