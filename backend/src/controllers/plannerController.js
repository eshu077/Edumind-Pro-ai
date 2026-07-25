const StudyTask = require("../models/StudyTask");
const User = require("../models/User");

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Streak = consecutive days (ending today or yesterday) with at least one
// completed task. Recomputed from scratch on every toggle — simple and
// always correct, and the task volume here is small enough that this
// never needs to be an incremental counter.
async function computeStreak(userId) {
  const tasks = await StudyTask.find({ user: userId, completed: true }).select("date").lean();
  const dates = new Set(tasks.map((t) => t.date));

  let streak = 0;
  const cursor = new Date();
  if (!dates.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// POST /api/planner/tasks  { title, date }
async function createTask(req, res, next) {
  try {
    const { title, date } = req.body;
    if (!title || !date) {
      return res.status(400).json({ success: false, message: "title and date are required" });
    }
    const task = await StudyTask.create({ user: req.user._id, title, date });
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

// GET /api/planner/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
async function listTasks(req, res, next) {
  try {
    const { from, to } = req.query;
    const query = { user: req.user._id };
    if (from && to) query.date = { $gte: from, $lte: to };
    const tasks = await StudyTask.find(query).sort("date");
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/planner/tasks/:id  { completed }
async function toggleTask(req, res, next) {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const wasCompleted = task.completed;
    task.completed = typeof req.body.completed === "boolean" ? req.body.completed : !task.completed;
    await task.save();

    const user = await User.findById(req.user._id);
    if (!wasCompleted && task.completed) user.xp = (user.xp || 0) + 5;
    else if (wasCompleted && !task.completed) user.xp = Math.max(0, (user.xp || 0) - 5);
    user.streak = await computeStreak(req.user._id);
    user.lastActiveAt = new Date();
    await user.save();

    res.json({ success: true, task, xp: user.xp, streak: user.streak });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/planner/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const result = await StudyTask.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, listTasks, toggleTask, deleteTask };
