"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema, type SignupInput } from "@/lib/validators";
import { apiFetch } from "@/lib/api";

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values),
        skipAuth: true,
      });
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Check your inbox" subtitle="We sent you a verification link.">
        <p className="text-sm text-subtle">
          Click the link we emailed you to activate your account, then log in.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </AuthShell>
    );
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
