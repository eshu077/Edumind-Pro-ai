import { apiFetch } from "./api";

export interface StudyTask {
  _id: string;
  title: string;
  date: string;
  completed: boolean;
}

export async function listTasks(from: string, to: string) {
  const data = await apiFetch<{ tasks: StudyTask[] }>(`/api/planner/tasks?from=${from}&to=${to}`);
  return data.tasks;
}

export async function createTask(title: string, date: string) {
  const data = await apiFetch<{ task: StudyTask }>("/api/planner/tasks", {
    method: "POST",
    body: JSON.stringify({ title, date }),
  });
  return data.task;
}

export async function toggleTask(id: string, completed: boolean) {
  return apiFetch<{ task: StudyTask; xp: number; streak: number }>(`/api/planner/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function deleteTask(id: string) {
  await apiFetch(`/api/planner/tasks/${id}`, { method: "DELETE" });
}
