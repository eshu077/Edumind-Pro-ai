"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  FileText,
  Compass,
  BookOpenText,
  NotebookPen,
  CalendarClock,
  Briefcase,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useHydrateAuth } from "@/lib/use-hydrate-auth";
import { apiFetch } from "@/lib/api";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tutor", label: "AI Tutor", icon: BrainCircuit },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/roadmap", label: "Roadmaps", icon: Compass },
  { href: "/dashboard/quizzes", label: "Knowledge Check", icon: BookOpenText },
  { href: "/dashboard/notes", label: "AI Notes", icon: NotebookPen },
  { href: "/dashboard/planner", label: "Study Planner", icon: CalendarClock },
  { href: "/dashboard/career", label: "Career Mentor", icon: Briefcase },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useHydrateAuth();
  const router = useRouter();
  const { user, isHydrating, clearSession } = useAuthStore();

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/login");
    }
  }, [isHydrating, user, router]);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  if (isHydrating) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-subtle">Loading your workspace…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/60 p-5 md:flex">
        <Link href="/" className="mb-8 font-display text-lg font-medium text-foreground">
          EduMind <span className="text-accent">Pro</span> AI
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-subtle transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-subtle transition-colors hover:bg-muted hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet text-sm font-medium text-violet-foreground">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} fill sizes="36px" className="object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {user.name}
                {user.role === "admin" && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                    Admin
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-subtle transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
