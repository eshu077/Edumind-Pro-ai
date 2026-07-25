"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";
import { listRoadmaps } from "@/lib/roadmap-api";
import {
  Flame,
  Trophy,
  Compass,
  BrainCircuit,
  FileText,
  BookOpenText,
  NotebookPen,
  CalendarClock,
  Briefcase,
} from "lucide-react";

const quickLinks = [
  { href: "/dashboard/tutor", label: "AI Tutor", icon: BrainCircuit },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/roadmap", label: "Roadmaps", icon: Compass },
  { href: "/dashboard/quizzes", label: "Knowledge Check", icon: BookOpenText },
  { href: "/dashboard/notes", label: "AI Notes", icon: NotebookPen },
  { href: "/dashboard/planner", label: "Study Planner", icon: CalendarClock },
  { href: "/dashboard/career", label: "Career Mentor", icon: Briefcase },
];

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [activeRoadmaps, setActiveRoadmaps] = useState(0);

  useEffect(() => {
    listRoadmaps()
      .then((roadmaps) => setActiveRoadmaps(roadmaps.filter((r) => r.status !== "failed").length))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-foreground">
        Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-subtle">Here's where you left off.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <StatCard icon={Flame} label="Current streak" value={`${user?.streak ?? 0} days`} />
        <StatCard icon={Trophy} label="XP earned" value={String(user?.xp ?? 0)} />
        <StatCard icon={Compass} label="Active roadmaps" value={String(activeRoadmaps)} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-medium text-foreground">Jump back in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-accent/50">
                <link.icon className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">{link.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-6">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-subtle">{label}</p>
    </Card>
  );
}
