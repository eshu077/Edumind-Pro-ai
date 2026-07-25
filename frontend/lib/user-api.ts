import { apiFetch, API_URL } from "./api";
import { useAuthStore } from "./auth-store";

export async function updateProfile(name: string) {
  const data = await apiFetch<{ user: any }>("/api/users/profile", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return data.user;
}

export async function uploadAvatar(file: File) {
  const token = useAuthStore.getState().accessToken;
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/api/users/avatar`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `Upload failed with status ${res.status}`);
  return body.user;
}
