"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { apiFetch, API_URL } from "@/lib/api";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`${API_URL}/api/auth/verify-email?token=${token}`)
      .then((res) => (res.ok ? setStatus("success") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthShell
      title={
        status === "verifying"
          ? "Verifying your email…"
          : status === "success"
          ? "Email verified"
          : "Verification failed"
      }
      subtitle={
        status === "success"
          ? "Your account is active. You can log in now."
          : status === "error"
          ? "That link is invalid or has expired."
          : undefined
      }
    >
      {status !== "verifying" && (
        <Button asChild size="lg" className="w-full">
          <Link href={status === "success" ? "/login" : "/signup"}>
            {status === "success" ? "Go to login" : "Back to signup"}
          </Link>
        </Button>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
