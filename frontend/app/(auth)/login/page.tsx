"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const data = await apiFetch<{ user: any; accessToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
        skipAuth: true,
      });
      setSession(data.user, data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up right where you left off."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton />
        <div className="flex items-center gap-3 text-xs text-subtle">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="mb-1.5 text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
          </div>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            Log in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
