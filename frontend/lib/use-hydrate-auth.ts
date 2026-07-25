"use client";

import { useEffect } from "react";
import { useAuthStore } from "./auth-store";
import { refreshAccessToken } from "./api";

// Runs once on mount to silently restore a session from the httpOnly
// refresh cookie, since the access token itself only ever lives in memory.
export function useHydrateAuth() {
  const setHydrating = useAuthStore((s) => s.setHydrating);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;
    refreshAccessToken().then((token) => {
      if (cancelled) return;
      if (!token) clearSession();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
