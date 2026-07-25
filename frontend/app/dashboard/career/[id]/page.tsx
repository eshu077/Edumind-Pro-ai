"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Target, ListChecks, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCareerPlan, type CareerPlan } from "@/lib/career-api";

export default function CareerPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getCareerPlan(params.id);
    setPlan(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    if (plan?.status !== "generating") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [plan?.status]);

  if (loading) return <p className="text-sm text-subtle">Loading…</p>;
  if (!plan) return <p className="text-sm text-danger">Not found.</p>;

  if (plan.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-subtle">Generating your career plan…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/career")}
        className="mb-5 flex items-center gap-1.5 text-sm text-subtle hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All plans
      </button>

      <h1 className="font-display text-2xl font-medium text-foreground">{plan.title}</h1>
      <p className="mt-2 text-sm text-subtle">{plan.summary}</p>

      {plan.recommendedRoles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {plan.recommendedRoles.map((r) => (
            <span key={r} className="rounded-full bg-violet/15 px-3 py-1 text-xs text-violet">
              {r}
            </span>
          ))}
        </div>
      )}

      {plan.skillGaps.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-medium text-foreground">
            <Target className="h-4 w-4 text-accent" /> Skill gaps to close
          </h2>
          <Card className="p-4">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
              {plan.skillGaps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {plan.actionPlan.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-medium text-foreground">
            <ListChecks className="h-4 w-4 text-accent" /> Action plan
          </h2>
          <div className="space-y-3">
            {plan.actionPlan.map((step, i) => (
              <Card key={i} className="flex gap-3 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.step}</p>
                  {step.description && <p className="mt-1 text-xs text-subtle">{step.description}</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {plan.resources.length > 0 && (
        <section className="mt-8 mb-10">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-medium text-foreground">
            <Link2 className="h-4 w-4 text-accent" /> Resources
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.resources.map((r, i) =>
              r.url ? (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground hover:border-accent/50"
                >
                  {r.title}
                </a>
              ) : (
                <div key={i} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-subtle">
                  {r.title}
                </div>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
