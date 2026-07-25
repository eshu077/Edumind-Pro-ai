"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flag, BookOpen, Video, GraduationCap, FileText, Link2, Clock, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getRoadmap, toggleTask, type Roadmap } from "@/lib/roadmap-api";
import { downloadCertificate } from "@/lib/export";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const RESOURCE_ICONS = {
  article: FileText,
  video: Video,
  course: GraduationCap,
  book: BookOpen,
  docs: Link2,
};

export default function RoadmapDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoadmap(params.id)
      .then(setRoadmap)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleToggle(weekNumber: number, taskId: string, completed: boolean) {
    if (!roadmap) return;
    setRoadmap({
      ...roadmap,
      weeklySchedule: roadmap.weeklySchedule.map((w) =>
        w.weekNumber === weekNumber
          ? { ...w, tasks: w.tasks.map((t) => (t._id === taskId ? { ...t, completed } : t)) }
          : w
      ),
    });
    const progressPercent = await toggleTask(roadmap.id, taskId, completed);
    setRoadmap((prev) => (prev ? { ...prev, progressPercent } : prev));
  }

  if (loading) {
    return <p className="text-sm text-subtle">Loading roadmap…</p>;
  }

  if (!roadmap) {
    return <p className="text-sm text-danger">Roadmap not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.push("/dashboard/roadmap")}
        className="mb-5 flex items-center gap-1.5 text-sm text-subtle hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All roadmaps
      </button>

      <h1 className="font-display text-2xl font-medium text-foreground">{roadmap.title}</h1>
      <p className="mt-2 text-sm text-subtle">{roadmap.summary}</p>

      <div className="mt-4 flex items-center gap-4">
        <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-subtle">{roadmap.difficulty}</span>
        <span className="text-xs text-subtle">{roadmap.durationWeeks} weeks</span>
        <div className="flex flex-1 items-center gap-2">
          <ProgressBar value={roadmap.progressPercent} />
          <span className="shrink-0 text-xs text-subtle">{roadmap.progressPercent}%</span>
        </div>
      </div>

      {roadmap.progressPercent === 100 && user && (
        <Card className="mt-5 flex items-center justify-between gap-4 border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">Roadmap complete!</p>
              <p className="text-xs text-subtle">Download a certificate for your records.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCertificate(user.name, roadmap.title, new Date().toLocaleDateString())}
          >
            Download certificate
          </Button>
        </Card>
      )}

      {/* Milestones */}
      {roadmap.milestones.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-medium text-foreground">Milestones</h2>
          <div className="space-y-3">
            {roadmap.milestones
              .slice()
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map((m, i) => (
                <Card key={i} className="flex gap-3 p-4">
                  <Flag className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Week {m.weekNumber} — {m.title}
                    </p>
                    {m.description && <p className="mt-1 text-xs text-subtle">{m.description}</p>}
                    {m.project && (
                      <p className="mt-1.5 text-xs text-violet">
                        <span className="font-medium">Project:</span> {m.project}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Weekly schedule */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-medium text-foreground">Weekly schedule</h2>
        <div className="space-y-3">
          {roadmap.weeklySchedule.map((week) => {
            const doneCount = week.tasks.filter((t) => t.completed).length;
            return (
              <Card key={week.weekNumber} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-accent">Week {week.weekNumber}</p>
                    <p className="mt-0.5 font-display text-base font-medium text-foreground">{week.theme}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-subtle">
                    <Clock className="h-3 w-3" /> ~{week.estimatedHours}h
                  </span>
                </div>

                {week.goals.length > 0 && (
                  <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-subtle">
                    {week.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {week.tasks.map((task) => (
                    <label key={task._id} className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => handleToggle(week.weekNumber, task._id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                      />
                      <span className={cn("text-sm text-foreground", task.completed && "text-subtle line-through")}>
                        {task.title}
                      </span>
                    </label>
                  ))}
                  <p className="pt-1 text-xs text-subtle">
                    {doneCount}/{week.tasks.length} tasks done
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      {roadmap.resources.length > 0 && (
        <section className="mt-8 mb-10">
          <h2 className="mb-3 font-display text-lg font-medium text-foreground">Recommended resources</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {roadmap.resources.map((r, i) => {
              const Icon = RESOURCE_ICONS[r.type] || FileText;
              const content = (
                <>
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="truncate">{r.title}</span>
                </>
              );
              return r.url ? (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground hover:border-accent/50"
                >
                  {content}
                </a>
              ) : (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-subtle">
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
