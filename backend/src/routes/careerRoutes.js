const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createCareerPlan,
  listCareerPlans,
  getCareerPlan,
  deleteCareerPlan,
} = require("../controllers/careerController");

const router = express.Router();

router.use(protect);

router.post("/", createCareerPlan);
router.get("/", listCareerPlans);
router.get("/:id", getCareerPlan);
router.delete("/:id", deleteCareerPlan);

module.exports = router;
