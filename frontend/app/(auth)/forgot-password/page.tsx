"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
        skipAuth: true,
      });
      setSent(true);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="If that email exists, a reset link is on its way.">
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a reset link."
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
        </div>
        {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
