import { apiFetch } from "./api";
import type { Difficulty } from "./roadmap-api";

export type QuestionType = "mcq" | "true_false" | "fill_blank" | "coding";

export interface QuizSummary {
  id: string;
  topic: string;
  difficulty: Difficulty;
  types: QuestionType[];
  title: string;
  status: "generating" | "ready" | "failed";
  errorMessage?: string;
  questionCount: number;
  createdAt: string;
}

export interface PlayableQuestion {
  index: number;
  type: QuestionType;
  question: string;
  options?: string[];
}

export interface PlayableQuiz {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  status: "generating" | "ready" | "failed";
  questions: PlayableQuestion[];
}

export interface AttemptResult {
  questionIndex: number;
  userAnswer: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

export interface AttemptSubmission {
  attempt: { id: string; correctCount: number; totalCount: number; scorePercent: number; createdAt: string };
  results: AttemptResult[];
}

export interface AttemptRecord {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  createdAt: string;
}

export interface QuizAnalytics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  quizzesTaken: number;
}

export async function listQuizzes() {
  const data = await apiFetch<{ quizzes: QuizSummary[] }>("/api/quizzes");
  return data.quizzes;
}

export async function createQuiz(input: {
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  types: QuestionType[];
}) {
  const data = await apiFetch<{ quiz: QuizSummary }>("/api/quizzes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.quiz;
}

export async function getQuiz(id: string) {
  const data = await apiFetch<{ quiz: PlayableQuiz | QuizSummary }>(`/api/quizzes/${id}`);
  return data.quiz;
}

export async function deleteQuiz(id: string) {
  await apiFetch(`/api/quizzes/${id}`, { method: "DELETE" });
}

export async function submitAttempt(quizId: string, answers: { questionIndex: number; userAnswer: string }[]) {
  return apiFetch<AttemptSubmission>(`/api/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function listAttempts(quizId: string) {
  const data = await apiFetch<{ attempts: AttemptRecord[] }>(`/api/quizzes/${quizId}/attempts`);
  return data.attempts;
}

export async function getQuizAnalytics() {
  const data = await apiFetch<{ analytics: QuizAnalytics }>("/api/quizzes/analytics/summary");
  return data.analytics;
}
