const express = require("express");
const { protect } = require("../middleware/auth");
const { createTask, listTasks, toggleTask, deleteTask } = require("../controllers/plannerController");

const router = express.Router();

router.use(protect);

router.post("/tasks", createTask);
router.get("/tasks", listTasks);
router.patch("/tasks/:id", toggleTask);
router.delete("/tasks/:id", deleteTask);

module.exports = router;
