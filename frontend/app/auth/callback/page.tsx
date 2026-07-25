"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

// The backend redirects here after a successful Google login with
// #accessToken=... in the URL fragment (never sent to servers/logs).
export default function AuthCallbackPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/accessToken=([^&]+)/);
    if (!match) {
      router.replace("/login?error=google");
      return;
    }
    const accessToken = decodeURIComponent(match[1]);

    apiFetch<{ user: any }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      skipAuth: true,
    })
      .then((data) => {
        setSession(data.user, accessToken);
        router.replace("/dashboard");
      })
      .catch(() => router.replace("/login?error=google"));
  }, [router, setSession]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-subtle">Signing you in…</p>
    </main>
  );
}
