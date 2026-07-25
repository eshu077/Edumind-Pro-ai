"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Compass, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  listRoadmaps,
  createRoadmap,
  deleteRoadmap,
  type RoadmapSummary,
  type Difficulty,
} from "@/lib/roadmap-api";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

export default function RoadmapListPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [goals, setGoals] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await listRoadmaps();
      setRoadmaps(data);
    } catch {
      // next refresh will retry
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const hasGenerating = roadmaps.some((r) => r.status === "generating");
    if (!hasGenerating) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [roadmaps]);

  async function handleCreate() {
    if (!subject.trim()) {
      setError("Enter a subject to build a roadmap for.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const roadmap = await createRoadmap({ subject: subject.trim(), difficulty, durationWeeks, goals: goals.trim() });
      setRoadmaps((prev) => [roadmap, ...prev]);
      setShowForm(false);
      setSubject("");
      setGoals("");
      setDurationWeeks(4);
      setDifficulty("beginner");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteRoadmap(id);
    setRoadmaps((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">Roadmaps</h1>
          <p className="mt-1 text-sm text-subtle">Personalized study paths, generated for your subject and timeline.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New roadmap
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Machine Learning, DSA in Python, System Design"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="goals">Learning goals (optional)</Label>
              <textarea
                id="goals"
                rows={3}
                placeholder="e.g. Preparing for internship interviews, want strong project portfolio pieces"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button className="mt-4" onClick={handleCreate} isLoading={isCreating}>
            Generate roadmap
          </Button>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roadmaps.length === 0 && !showForm ? (
          <Card className="col-span-full flex flex-col items-center gap-2 p-10 text-center">
            <Compass className="h-7 w-7 text-accent" />
            <p className="text-sm text-subtle">No roadmaps yet — generate your first one.</p>
          </Card>
        ) : (
          roadmaps.map((r) => <RoadmapCard key={r.id} roadmap={r} onDelete={() => handleDelete(r.id)} />)
        )}
      </div>
    </div>
  );
}

function RoadmapCard({ roadmap, onDelete }: { roadmap: RoadmapSummary; onDelete: () => void }) {
  if (roadmap.status === "generating") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="text-sm font-medium text-foreground">{roadmap.subject}</p>
        <p className="flex items-center gap-1.5 text-xs text-violet">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating your roadmap…
        </p>
      </Card>
    );
  }

  if (roadmap.status === "failed") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">{roadmap.subject}</p>
          <button onClick={onDelete} className="text-subtle hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {roadmap.errorMessage || "Generation failed"}
        </p>
      </Card>
    );
  }

  return (
    <Card className="group relative flex flex-col gap-3 p-5">
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete roadmap"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Link href={`/dashboard/roadmap/${roadmap.id}`} className="flex flex-1 flex-col gap-3">
        <div>
          <p className="pr-6 font-display text-base font-medium text-foreground">{roadmap.title || roadmap.subject}</p>
          <p className="mt-1 line-clamp-2 text-xs text-subtle">{roadmap.summary}</p>
        </div>
        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between text-xs text-subtle">
            <span className="capitalize">{roadmap.difficulty} · {roadmap.durationWeeks}w</span>
            <span>{roadmap.progressPercent}%</span>
          </div>
          <ProgressBar value={roadmap.progressPercent} />
        </div>
      </Link>
    </Card>
  );
}
