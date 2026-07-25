import { apiFetch } from "./api";

export interface AdminStats {
  userCount: number;
  roadmapCount: number;
  quizCount: number;
  documentCount: number;
  noteCount: number;
  conversationCount: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  isEmailVerified: boolean;
  xp: number;
  streak: number;
  createdAt: string;
}

export async function getAdminStats() {
  const data = await apiFetch<{ stats: AdminStats }>("/api/admin/stats");
  return data.stats;
}

export async function listAdminUsers() {
  const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
  return data.users;
}

export async function deleteAdminUser(id: string) {
  await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}
