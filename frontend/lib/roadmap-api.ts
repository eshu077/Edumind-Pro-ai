import { apiFetch } from "./api";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface RoadmapSummary {
  id: string;
  subject: string;
  difficulty: Difficulty;
  durationWeeks: number;
  title: string;
  summary: string;
  status: "generating" | "ready" | "failed";
  errorMessage?: string;
  progressPercent: number;
  createdAt: string;
}

export interface RoadmapTask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface RoadmapWeek {
  weekNumber: number;
  theme: string;
  goals: string[];
  tasks: RoadmapTask[];
  estimatedHours: number;
}

export interface RoadmapMilestone {
  weekNumber: number;
  title: string;
  description: string;
  project: string | null;
}

export interface RoadmapResource {
  title: string;
  url: string | null;
  type: "article" | "video" | "course" | "book" | "docs";
}

export interface Roadmap extends RoadmapSummary {
  goals: string;
  weeklySchedule: RoadmapWeek[];
  milestones: RoadmapMilestone[];
  resources: RoadmapResource[];
}

export async function listRoadmaps() {
  const data = await apiFetch<{ roadmaps: RoadmapSummary[] }>("/api/roadmaps");
  return data.roadmaps;
}

export async function createRoadmap(input: {
  subject: string;
  difficulty: Difficulty;
  durationWeeks: number;
  goals: string;
}) {
  const data = await apiFetch<{ roadmap: RoadmapSummary }>("/api/roadmaps", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.roadmap;
}

export async function getRoadmap(id: string) {
  const data = await apiFetch<{ roadmap: Roadmap }>(`/api/roadmaps/${id}`);
  return data.roadmap;
}

export async function deleteRoadmap(id: string) {
  await apiFetch(`/api/roadmaps/${id}`, { method: "DELETE" });
}

export async function toggleTask(roadmapId: string, taskId: string, completed: boolean) {
  const data = await apiFetch<{ progressPercent: number }>(`/api/roadmaps/${roadmapId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
  return data.progressPercent;
}
