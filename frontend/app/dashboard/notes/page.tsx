"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, NotebookPen, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listNotes, createNote, deleteNote, type NoteSummary, type NoteFormat } from "@/lib/note-api";
import { listDocuments, type DocumentSummary } from "@/lib/document-api";

const FORMAT_OPTIONS: { value: NoteFormat; label: string; description: string }[] = [
  { value: "notes", label: "Notes", description: "Structured, thorough study notes" },
  { value: "cheatsheet", label: "Cheat sheet", description: "Compact key facts, formulas, syntax" },
  { value: "summary", label: "Summary", description: "Short, ~400-word overview" },
  { value: "flashcards", label: "Flashcards", description: "Front/back cards for recall practice" },
  { value: "mind_map", label: "Mind map outline", description: "Nested branches, no prose" },
  { value: "interview_questions", label: "Interview Q&A", description: "Practice questions with model answers" },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<NoteFormat>("notes");
  const [documentId, setDocumentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const list = await listNotes();
      setNotes(list);
    } catch {
      // next refresh retries
    }
  }

  useEffect(() => {
    refresh();
    listDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.status === "ready")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const hasGenerating = notes.some((n) => n.status === "generating");
    if (!hasGenerating) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [notes]);

  async function handleCreate() {
    if (!topic.trim()) {
      setError("Enter a topic to generate from.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const note = await createNote({ topic: topic.trim(), format, documentId: documentId || undefined });
      setNotes((prev) => [note, ...prev]);
      setShowForm(false);
      setTopic("");
      setDocumentId("");
      setFormat("notes");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">AI Notes</h1>
          <p className="mt-1 text-sm text-subtle">Notes, cheat sheets, flashcards, summaries, and more — from a topic or a document.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Photosynthesis, React useEffect, Newton's laws"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value as NoteFormat)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-subtle">{FORMAT_OPTIONS.find((o) => o.value === format)?.description}</p>
            </div>
            <div>
              <Label htmlFor="document">Base on a document (optional)</Label>
              <select
                id="document"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">Use general knowledge</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.originalName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button className="mt-4" onClick={handleCreate} isLoading={isCreating}>
            Generate
          </Button>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.length === 0 && !showForm ? (
          <Card className="col-span-full flex flex-col items-center gap-2 p-10 text-center">
            <NotebookPen className="h-7 w-7 text-accent" />
            <p className="text-sm text-subtle">Nothing generated yet.</p>
          </Card>
        ) : (
          notes.map((n) => <NoteCard key={n.id} note={n} onDelete={() => handleDelete(n.id)} />)
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onDelete }: { note: NoteSummary; onDelete: () => void }) {
  if (note.status === "generating") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="text-sm font-medium text-foreground">{note.topic}</p>
        <p className="flex items-center gap-1.5 text-xs text-violet">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
        </p>
      </Card>
    );
  }

  if (note.status === "failed") {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">{note.topic}</p>
          <button onClick={onDelete} className="text-subtle hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {note.errorMessage || "Generation failed"}
        </p>
      </Card>
    );
  }

  const formatLabel = FORMAT_OPTIONS.find((o) => o.value === note.format)?.label || note.format;

  return (
    <Card className="group relative flex flex-col gap-2 p-5">
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <Link href={`/dashboard/notes/${note.id}`} className="flex flex-1 flex-col gap-2">
        <p className="pr-6 font-display text-base font-medium text-foreground">{note.title || note.topic}</p>
        <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-subtle">{formatLabel}</span>
      </Link>
    </Card>
  );
}
