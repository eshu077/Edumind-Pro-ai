"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listCareerPlans,
  createCareerPlan,
  deleteCareerPlan,
  type CareerPlanSummary,
  type ExperienceLevel,
} from "@/lib/career-api";

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "entry", label: "Entry-level" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
];

export default function CareerMentorPage() {
  const [plans, setPlans] = useState<CareerPlanSummary[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("student");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setPlans(await listCareerPlans());
    } catch {
      // next refresh retries
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const hasGenerating = plans.some((p) => p.status === "generating");
    if (!hasGenerating) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [plans]);

  async function handleCreate() {
    if (!targetRole.trim()) {
      setError("Enter a target role.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const plan = await createCareerPlan({ targetRole: targetRole.trim(), currentSkills, experienceLevel });
      setPlans((prev) => [plan, ...prev]);
      setShowForm(false);
      setTargetRole("");
      setCurrentSkills("");
      setExperienceLevel("student");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteCareerPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">Career Mentor</h1>
          <p className="mt-1 text-sm text-subtle">Skill gaps, an action plan, and resources for where you want to go.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New plan
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="role">Target role</Label>
              <Input
                id="role"
                placeholder="e.g. Frontend Engineer, Data Scientist, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="level">Experience level</Label>
              <select
                id="level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="skills">Current skills / background (optional)</Label>
              <textarea
                id="skills"
                rows={3}
                placeholder="e.g. B.Tech in CS, know Python and basic React, built two personal projects"
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button className="mt-4" onClick={handleCreate} isLoading={isCreating}>
            Generate plan
          </Button>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.length === 0 && !showForm ? (
          <Card className="col-span-full flex flex-col items-center gap-2 p-10 text-center">
            <Briefcase className="h-7 w-7 text-accent" />
            <p className="text-sm text-subtle">No career plans yet.</p>
          </Card>
        ) : (
          plans.map((p) => <PlanCard key={p.id} plan={p} onDelete={() => handleDelete(p.id)} />)
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, onDelete }: { plan: CareerPlanSummary; onDelete: () => void }) {
  if (plan.status === "generating") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="text-sm font-medium text-foreground">{plan.targetRole}</p>
        <p className="flex items-center gap-1.5 text-xs text-violet">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
        </p>
      </Card>
    );
  }

  if (plan.status === "failed") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">{plan.targetRole}</p>
          <button onClick={onDelete} className="text-subtle hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {plan.errorMessage || "Generation failed"}
        </p>
      </Card>
    );
  }

  return (
    <Card className="group relative flex flex-col gap-2 p-5">
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Link href={`/dashboard/career/${plan.id}`} className="flex flex-1 flex-col gap-2">
        <p className="pr-6 font-display text-base font-medium text-foreground">{plan.title || plan.targetRole}</p>
        <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-[11px] capitalize text-subtle">{plan.experienceLevel}</span>
      </Link>
    </Card>
  );
}
