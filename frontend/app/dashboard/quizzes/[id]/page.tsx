"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Loader2, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadCertificate } from "@/lib/export";
import { useAuthStore } from "@/lib/auth-store";
import {
  getQuiz,
  submitAttempt,
  listAttempts,
  type PlayableQuiz,
  type AttemptResult,
  type AttemptRecord,
} from "@/lib/quiz-api";

export default function QuizTakingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [quiz, setQuiz] = useState<PlayableQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<AttemptResult[] | null>(null);
  const [score, setScore] = useState<{ correctCount: number; totalCount: number; scorePercent: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  async function loadQuiz() {
    const data = await getQuiz(params.id);
    setQuiz(data as PlayableQuiz);
    setLoading(false);
  }

  useEffect(() => {
    loadQuiz();
    listAttempts(params.id).then(setAttempts).catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (quiz?.status !== "generating") return;
    const interval = setInterval(loadQuiz, 3000);
    return () => clearInterval(interval);
  }, [quiz?.status]);

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  async function handleSubmit() {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({ questionIndex: q.index, userAnswer: answers[q.index] || "" }));
      const data = await submitAttempt(quiz.id, payload);
      setResults(data.results);
      setScore(data.attempt);
      const updated = await listAttempts(quiz.id);
      setAttempts(updated);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResults(null);
    setScore(null);
  }

  if (loading) return <p className="text-sm text-subtle">Loading quiz…</p>;
  if (!quiz) return <p className="text-sm text-danger">Quiz not found.</p>;

  if (quiz.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-subtle">Generating your quiz…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/quizzes")}
        className="mb-5 flex items-center gap-1.5 text-sm text-subtle hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All quizzes
      </button>

      <h1 className="font-display text-2xl font-medium text-foreground">{quiz.title}</h1>
      <p className="mt-1 text-sm capitalize text-subtle">
        {quiz.topic} · {quiz.difficulty} · {quiz.questions.length} questions
      </p>

      {score && (
        <Card className="mt-5 flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-medium text-accent">
              {score.scorePercent}%
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {score.correctCount} of {score.totalCount} correct
              </p>
              <button onClick={handleRetry} className="mt-1 flex items-center gap-1.5 text-xs text-accent hover:underline">
                <RotateCcw className="h-3 w-3" /> Retry quiz
              </button>
            </div>
          </div>
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCertificate(user.name, quiz.title, new Date().toLocaleDateString())}
            >
              <Award className="h-3.5 w-3.5" /> Certificate
            </Button>
          )}
        </Card>
      )}

      <div className="mt-6 space-y-5">
        {quiz.questions.map((q) => {
          const result = results?.find((r) => r.questionIndex === q.index);
          return (
            <Card key={q.index} className="p-5">
              <p className="text-xs font-medium text-accent">
                Question {q.index + 1} · {q.type.replace("_", " ")}
              </p>
              <p className="mt-1.5 text-sm text-foreground">{q.question}</p>

              <div className="mt-4">
                {q.type === "mcq" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <RadioOption
                        key={opt}
                        name={`q-${q.index}`}
                        checked={answers[q.index] === opt}
                        disabled={!!result}
                        onChange={() => setAnswer(q.index, opt)}
                        label={opt}
                        state={result ? optionState(opt, result) : undefined}
                      />
                    ))}
                  </div>
                )}

                {q.type === "true_false" && (
                  <div className="space-y-2">
                    {["True", "False"].map((opt) => (
                      <RadioOption
                        key={opt}
                        name={`q-${q.index}`}
                        checked={answers[q.index] === opt}
                        disabled={!!result}
                        onChange={() => setAnswer(q.index, opt)}
                        label={opt}
                        state={result ? optionState(opt, result) : undefined}
                      />
                    ))}
                  </div>
                )}

                {(q.type === "fill_blank" || q.type === "coding") && (
                  <textarea
                    value={answers[q.index] || ""}
                    onChange={(e) => setAnswer(q.index, e.target.value)}
                    disabled={!!result}
                    rows={q.type === "coding" ? 4 : 1}
                    placeholder={q.type === "coding" ? "Explain your answer…" : "Your answer…"}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70"
                  />
                )}
              </div>

              {result && (
                <div
                  className={cn(
                    "mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs",
                    result.correct ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
                  )}
                >
                  {result.correct ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {result.correct ? "Correct" : `Correct answer: ${result.correctAnswer}`}
                    </p>
                    {result.explanation && <p className="mt-1 text-subtle">{result.explanation}</p>}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!results && (
        <Button className="mt-6 w-full" size="lg" onClick={handleSubmit} isLoading={isSubmitting}>
          Submit quiz
        </Button>
      )}

      {attempts.length > 0 && (
        <div className="mt-8 mb-10">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-medium text-foreground">
            <Trophy className="h-4 w-4 text-accent" /> Your attempts
          </h2>
          <Card className="divide-y divide-border">
            {attempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-subtle">{new Date(a.createdAt).toLocaleString()}</span>
                <span className="font-medium text-foreground">
                  {a.correctCount}/{a.totalCount} · {a.scorePercent}%
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function optionState(option: string, result: AttemptResult): "correct" | "incorrect" | "missed" | undefined {
  const isCorrectAnswer = option === result.correctAnswer;
  const isUserAnswer = option === result.userAnswer;
  if (isCorrectAnswer) return "correct";
  if (isUserAnswer && !result.correct) return "incorrect";
  return undefined;
}

function RadioOption({
  name,
  checked,
  disabled,
  onChange,
  label,
  state,
}: {
  name: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  label: string;
  state?: "correct" | "incorrect" | "missed";
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
        state === "correct" && "border-success/40 bg-success/10 text-success",
        state === "incorrect" && "border-danger/40 bg-danger/10 text-danger",
        !state && "border-border text-foreground hover:border-accent/40",
        disabled && "cursor-default"
      )}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} className="h-4 w-4 accent-accent" />
      {label}
    </label>
  );
}
