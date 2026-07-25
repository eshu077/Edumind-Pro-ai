const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { getStats, listUsers, deleteUser } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.delete("/users/:id", deleteUser);

module.exports = router;
