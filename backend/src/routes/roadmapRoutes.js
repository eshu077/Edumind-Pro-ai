const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createRoadmap,
  listRoadmaps,
  getRoadmap,
  deleteRoadmap,
  toggleTask,
} = require("../controllers/roadmapController");

const router = express.Router();

router.use(protect);

router.post("/", createRoadmap);
router.get("/", listRoadmaps);
router.get("/:id", getRoadmap);
router.delete("/:id", deleteRoadmap);
router.patch("/:id/tasks/:taskId", toggleTask);

module.exports = router;
