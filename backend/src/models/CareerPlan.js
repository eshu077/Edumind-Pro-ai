const mongoose = require("mongoose");

const careerPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetRole: { type: String, required: true },
    currentSkills: { type: String, default: "" },
    experienceLevel: { type: String, enum: ["student", "entry", "mid", "senior"], required: true },
    title: { type: String, default: "" },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
    summary: { type: String, default: "" },
    skillGaps: [{ type: String }],
    recommendedRoles: [{ type: String }],
    actionPlan: [{ step: String, description: String }],
    resources: [{ title: String, url: String }],
  },
  { timestamps: true }
);

careerPlanSchema.methods.toSummary = function () {
  return {
    id: this._id,
    targetRole: this.targetRole,
    experienceLevel: this.experienceLevel,
    title: this.title,
    status: this.status,
    errorMessage: this.errorMessage,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("CareerPlan", careerPlanSchema);
