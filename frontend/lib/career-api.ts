import { apiFetch } from "./api";

export type ExperienceLevel = "student" | "entry" | "mid" | "senior";

export interface CareerPlanSummary {
  id: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  title: string;
  status: "generating" | "ready" | "failed";
  errorMessage?: string;
  createdAt: string;
}

export interface CareerPlan extends CareerPlanSummary {
  currentSkills: string;
  summary: string;
  skillGaps: string[];
  recommendedRoles: string[];
  actionPlan: { step: string; description: string }[];
  resources: { title: string; url: string | null }[];
}

export async function listCareerPlans() {
  const data = await apiFetch<{ plans: CareerPlanSummary[] }>("/api/career");
  return data.plans;
}

export async function createCareerPlan(input: {
  targetRole: string;
  currentSkills: string;
  experienceLevel: ExperienceLevel;
}) {
  const data = await apiFetch<{ plan: CareerPlanSummary }>("/api/career", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.plan;
}

export async function getCareerPlan(id: string) {
  const data = await apiFetch<{ plan: CareerPlan }>(`/api/career/${id}`);
  return data.plan;
}

export async function deleteCareerPlan(id: string) {
  await apiFetch(`/api/career/${id}`, { method: "DELETE" });
}
