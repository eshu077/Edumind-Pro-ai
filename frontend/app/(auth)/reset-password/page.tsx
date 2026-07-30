"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      setServerError("Reset link is missing its token. Request a new one.");
      return;
    }
    setServerError(null);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: values.password }),
        skipAuth: true,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    }
  }

  if (done) {
    return (
      <AuthShell title="Password reset" subtitle="Taking you to login...">
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Go to login now</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose something you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} error={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        </div>
        {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
