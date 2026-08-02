"use client";

import { useEffect, useState } from "react";
import { Users, Compass, BookOpenText, FileText, NotebookPen, MessageSquare, Trash2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";
import { getAdminStats, listAdminUsers, deleteAdminUser, type AdminStats, type AdminUser } from "@/lib/admin-api";

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([getAdminStats(), listAdminUsers()])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u);
      })
      .catch((err) => setError(err.message || "Couldn't load admin data"));
  }, [user]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this user permanently? This can't be undone.")) return;
    await deleteAdminUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  if (user?.role !== "admin") {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-2 p-10 text-center">
        <ShieldAlert className="h-7 w-7 text-danger" />
        <p className="text-sm text-subtle">This page is for admin accounts only.</p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-foreground">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-subtle">Platform overview and user management.</p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Users} label="Users" value={stats.userCount} />
          <StatCard icon={Compass} label="Roadmaps" value={stats.roadmapCount} />
          <StatCard icon={BookOpenText} label="Quizzes" value={stats.quizCount} />
          <StatCard icon={FileText} label="Documents" value={stats.documentCount} />
          <StatCard icon={NotebookPen} label="Notes" value={stats.noteCount} />
          <StatCard icon={MessageSquare} label="Conversations" value={stats.conversationCount} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-medium text-foreground">Users</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-subtle">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">XP</th>
                <th className="px-4 py-3 font-medium">Streak</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-subtle">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-subtle">{u.role}</td>
                  <td className="px-4 py-3 text-subtle">{u.xp}</td>
                  <td className="px-4 py-3 text-subtle">{u.streak}</td>
                  <td className="px-4 py-3 text-right">
                    {u._id !== user.id && (
                      <button onClick={() => handleDelete(u._id)} className="text-subtle hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-4">
      <Icon className="mb-2 h-4 w-4 text-accent" />
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-subtle">{label}</p>
    </Card>
  );
}
