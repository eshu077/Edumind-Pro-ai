import { apiFetch } from "./api";

export type NoteFormat = "notes" | "cheatsheet" | "summary" | "flashcards" | "mind_map" | "interview_questions";

export interface NoteSummary {
  id: string;
  topic: string;
  format: NoteFormat;
  title: string;
  status: "generating" | "ready" | "failed";
  errorMessage?: string;
  createdAt: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Note extends NoteSummary {
  content: string;
  flashcards: Flashcard[];
  sourceDocument: string | null;
}

export async function listNotes() {
  const data = await apiFetch<{ notes: NoteSummary[] }>("/api/notes");
  return data.notes;
}

export async function createNote(input: { topic: string; format: NoteFormat; documentId?: string }) {
  const data = await apiFetch<{ note: NoteSummary }>("/api/notes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.note;
}

export async function getNote(id: string) {
  const data = await apiFetch<{ note: Note }>(`/api/notes/${id}`);
  return data.note;
}

export async function deleteNote(id: string) {
  await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
}
