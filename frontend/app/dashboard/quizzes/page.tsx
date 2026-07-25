"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpenText, Loader2, AlertCircle, Trash2, Target, Trophy, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listQuizzes,
  createQuiz,
  deleteQuiz,
  getQuizAnalytics,
  type QuizSummary,
  type QuestionType,
  type QuizAnalytics,
} from "@/lib/quiz-api";
import type { Difficulty } from "@/lib/roadmap-api";
import { cn } from "@/lib/utils";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "coding", label: "Coding / conceptual" },
];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [questionCount, setQuestionCount] = useState(5);
  const [types, setTypes] = useState<Set<QuestionType>>(new Set(["mcq"]));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [quizList, stats] = await Promise.all([listQuizzes(), getQuizAnalytics()]);
      setQuizzes(quizList);
      setAnalytics(stats);
    } catch {
      // next refresh retries
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const hasGenerating = quizzes.some((q) => q.status === "generating");
    if (!hasGenerating) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [quizzes]);

  function toggleType(t: QuestionType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function handleCreate() {
    if (!topic.trim()) {
      setError("Enter a topic to quiz yourself on.");
      return;
    }
    if (types.size === 0) {
      setError("Pick at least one question type.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const quiz = await createQuiz({
        topic: topic.trim(),
        difficulty,
        questionCount,
        types: Array.from(types),
      });
      setQuizzes((prev) => [quiz, ...prev]);
      setShowForm(false);
      setTopic("");
      setQuestionCount(5);
      setDifficulty("beginner");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteQuiz(id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">Knowledge Check</h1>
          <p className="mt-1 text-sm text-subtle">AI-generated quizzes with instant scoring and explanations.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New quiz
        </Button>
      </div>

      {analytics && analytics.totalAttempts > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard icon={ListChecks} label="Quizzes taken" value={String(analytics.quizzesTaken)} />
          <StatCard icon={Target} label="Average score" value={`${analytics.averageScore}%`} />
          <StatCard icon={Trophy} label="Best score" value={`${analytics.bestScore}%`} />
        </div>
      )}

      {showForm && (
        <Card className="mt-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. React Hooks, Big-O notation, Cell biology"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="count">Number of questions</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={25}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Question types</Label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      types.has(opt.value)
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-subtle hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button className="mt-4" onClick={handleCreate} isLoading={isCreating}>
            Generate quiz
          </Button>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.length === 0 && !showForm ? (
          <Card className="col-span-full flex flex-col items-center gap-2 p-10 text-center">
            <BookOpenText className="h-7 w-7 text-accent" />
            <p className="text-sm text-subtle">No quizzes yet — generate your first one.</p>
          </Card>
        ) : (
          quizzes.map((q) => <QuizCard key={q.id} quiz={q} onDelete={() => handleDelete(q.id)} />)
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5">
      <Icon className="mb-2.5 h-5 w-5 text-accent" />
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-subtle">{label}</p>
    </Card>
  );
}

function QuizCard({ quiz, onDelete }: { quiz: QuizSummary; onDelete: () => void }) {
  if (quiz.status === "generating") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="text-sm font-medium text-foreground">{quiz.topic}</p>
        <p className="flex items-center gap-1.5 text-xs text-violet">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating your quiz…
        </p>
      </Card>
    );
  }

  if (quiz.status === "failed") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">{quiz.topic}</p>
          <button onClick={onDelete} className="text-subtle hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {quiz.errorMessage || "Generation failed"}
        </p>
      </Card>
    );
  }

  return (
    <Card className="group relative flex flex-col gap-3 p-5">
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete quiz"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Link href={`/dashboard/quizzes/${quiz.id}`} className="flex flex-1 flex-col gap-2">
        <p className="pr-6 font-display text-base font-medium text-foreground">{quiz.title || quiz.topic}</p>
        <p className="text-xs capitalize text-subtle">
          {quiz.difficulty} · {quiz.questionCount} questions
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {quiz.types.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-subtle">
              {t.replace("_", " ")}
            </span>
          ))}
        </div>
      </Link>
    </Card>
  );
}
