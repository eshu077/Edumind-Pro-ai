"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema, type SignupInput } from "@/lib/validators";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    try {
      const data = await apiFetch<{ user: any; accessToken: string }>("/api/auth/signup", {
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
      title="Create your account"
      subtitle="Start with a free AI-generated roadmap."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Eshu Sharma" {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} error={errors.password?.message} />
          </div>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
