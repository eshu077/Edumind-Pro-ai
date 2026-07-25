"use client";

import { useEffect, useState } from "react";
import { Plus, Flame, Trophy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { listTasks, createTask, toggleTask, deleteTask, type StudyTask } from "@/lib/planner-api";
import { cn } from "@/lib/utils";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getWeekDates() {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function PlannerPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const weekDates = getWeekDates();
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudyTask[]>>({});
  const [newTitle, setNewTitle] = useState("");

  async function refresh() {
    const from = toDateStr(weekDates[0]);
    const to = toDateStr(weekDates[weekDates.length - 1]);
    const tasks = await listTasks(from, to);
    const grouped: Record<string, StudyTask[]> = {};
    for (const t of tasks) {
      grouped[t.date] = grouped[t.date] || [];
      grouped[t.date].push(t);
    }
    setTasksByDate(grouped);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    const task = await createTask(newTitle.trim(), selectedDate);
    setTasksByDate((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), task] }));
    setNewTitle("");
  }

  async function handleToggle(task: StudyTask) {
    const nextCompleted = !task.completed;
    setTasksByDate((prev) => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map((t) => (t._id === task._id ? { ...t, completed: nextCompleted } : t)),
    }));
    const { xp, streak } = await toggleTask(task._id, nextCompleted);
    updateUser({ xp, streak });
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    setTasksByDate((prev) => ({ ...prev, [selectedDate]: prev[selectedDate].filter((t) => t._id !== id) }));
  }

  const todaysTasks = tasksByDate[selectedDate] || [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">Study Planner</h1>
          <p className="mt-1 text-sm text-subtle">Plan your days, build a streak.</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
            <Flame className="h-3.5 w-3.5 text-accent" /> {user?.streak ?? 0} day streak
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
            <Trophy className="h-3.5 w-3.5 text-accent" /> {user?.xp ?? 0} XP
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {weekDates.map((d) => {
          const dStr = toDateStr(d);
          const isToday = dStr === toDateStr(new Date());
          const count = tasksByDate[dStr]?.length || 0;
          const doneCount = tasksByDate[dStr]?.filter((t) => t.completed).length || 0;
          return (
            <button
              key={dStr}
              onClick={() => setSelectedDate(dStr)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 transition-colors",
                dStr === selectedDate ? "border-accent bg-accent/10" : "border-border hover:bg-muted"
              )}
            >
              <span className="text-[10px] uppercase text-subtle">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className={cn("text-sm font-medium", isToday ? "text-accent" : "text-foreground")}>{d.getDate()}</span>
              {count > 0 && (
                <span className="text-[10px] text-subtle">
                  {doneCount}/{count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <p className="mb-3 text-sm font-medium text-foreground">
          {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-2">
          {todaysTasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-subtle">No tasks for this day yet.</p>
          ) : (
            todaysTasks.map((task) => (
              <div key={task._id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task)}
                  className="h-4 w-4 shrink-0 accent-accent"
                />
                <span className={cn("flex-1 text-sm text-foreground", task.completed && "text-subtle line-through")}>
                  {task.title}
                </span>
                <button onClick={() => handleDelete(task._id)} className="text-subtle hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Add a task for this day…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
