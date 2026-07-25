const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const weekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    theme: { type: String, required: true },
    goals: [{ type: String }],
    tasks: [taskSchema],
    estimatedHours: { type: Number, default: 5 },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    project: { type: String, default: null },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: null },
    type: { type: String, enum: ["article", "video", "course", "book", "docs"], default: "article" },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    durationWeeks: { type: Number, required: true, min: 1, max: 52 },
    goals: { type: String, default: "" },

    title: { type: String, default: "" },
    summary: { type: String, default: "" },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },

    weeklySchedule: [weekSchema],
    milestones: [milestoneSchema],
    resources: [resourceSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roadmapSchema.virtual("progressPercent").get(function () {
  let total = 0;
  let done = 0;
  for (const week of this.weeklySchedule) {
    for (const task of week.tasks) {
      total += 1;
      if (task.completed) done += 1;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
});

roadmapSchema.methods.toSummary = function () {
  return {
    id: this._id,
    subject: this.subject,
    difficulty: this.difficulty,
    durationWeeks: this.durationWeeks,
    title: this.title,
    summary: this.summary,
    status: this.status,
    errorMessage: this.errorMessage,
    progressPercent: this.progressPercent,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Roadmap", roadmapSchema);
