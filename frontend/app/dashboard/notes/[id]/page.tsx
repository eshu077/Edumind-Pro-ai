"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, ChevronLeft, ChevronRight, RotateCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { getNote, type Note } from "@/lib/note-api";
import { downloadMarkdown, downloadPdfFromLines, markdownToPlainLines } from "@/lib/export";
import { cn } from "@/lib/utils";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getNote(params.id);
    setNote(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    if (note?.status !== "generating") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [note?.status]);

  if (loading) return <p className="text-sm text-subtle">Loading…</p>;
  if (!note) return <p className="text-sm text-danger">Not found.</p>;

  if (note.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-subtle">Generating…</p>
      </div>
    );
  }

  function handleExportMarkdown() {
    if (!note) return;
    if (note.format === "flashcards") {
      const md = `# ${note.title}\n\n` + note.flashcards.map((f, i) => `### ${i + 1}. ${f.front}\n\n${f.back}`).join("\n\n");
      downloadMarkdown(note.title, md);
    } else {
      downloadMarkdown(note.title, note.content);
    }
  }

  function handleExportPdf() {
    if (!note) return;
    if (note.format === "flashcards") {
      const lines = note.flashcards.flatMap((f, i) => [`${i + 1}. ${f.front}`, `   → ${f.back}`, ""]);
      downloadPdfFromLines(note.title, note.title, lines);
    } else {
      downloadPdfFromLines(note.title, note.title, markdownToPlainLines(note.content));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/notes")}
        className="mb-5 flex items-center gap-1.5 text-sm text-subtle hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All notes
      </button>

      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl font-medium text-foreground">{note.title}</h1>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
            <FileText className="h-3.5 w-3.5" /> .md
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {note.format === "flashcards" ? (
          <FlashcardViewer flashcards={note.flashcards} />
        ) : (
          <Card className="p-6">
            <MarkdownRenderer content={note.content} />
          </Card>
        )}
      </div>
    </div>
  );
}

function FlashcardViewer({ flashcards }: { flashcards: Note["flashcards"] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) return <p className="text-sm text-subtle">No flashcards generated.</p>;
  const card = flashcards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((prev) => (prev + delta + flashcards.length) % flashcards.length);
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs text-subtle">
        Card {index + 1} of {flashcards.length}
      </p>

      <button
        onClick={() => setFlipped((v) => !v)}
        className="flex h-56 w-full max-w-md items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-lg transition-transform hover:scale-[1.01]"
      >
        <div>
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide text-subtle">
            <RotateCw className="h-3 w-3" /> {flipped ? "Answer" : "Question"} · tap to flip
          </p>
          <p className={cn("font-display text-lg font-medium text-foreground", flipped && "text-accent")}>
            {flipped ? card.back : card.front}
          </p>
        </div>
      </button>

      <div className="mt-5 flex items-center gap-4">
        <button onClick={() => go(-1)} className="rounded-full border border-border p-2 text-subtle hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => go(1)} className="rounded-full border border-border p-2 text-subtle hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
