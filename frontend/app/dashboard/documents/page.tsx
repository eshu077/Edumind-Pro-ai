"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  streamAsk,
  type DocumentSummary,
  type RagSource,
} from "@/lib/document-api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<RagSource[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // transient — next poll or manual action will retry
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while anything is still processing so status badges update live.
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [documents, refresh]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const doc = await uploadDocument(file);
        setDocuments((prev) => [doc, ...prev]);
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || selected.size === 0 || isAsking) return;

    setAskError(null);
    setAnswer("");
    setSources([]);
    setIsAsking(true);

    await streamAsk(Array.from(selected), q, {
      onSources: (s) => setSources(s),
      onToken: (text) => setAnswer((prev) => prev + text),
      onDone: () => setIsAsking(false),
      onError: (message) => {
        setAskError(message);
        setIsAsking(false);
      },
    });
  }

  const readyCount = documents.filter((d) => d.status === "ready").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Left: library */}
      <div>
        <h1 className="font-display text-2xl font-medium text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-subtle">
          Upload PDFs, Word docs, slide decks, or text files, then ask questions answered strictly from their content.
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 px-4 py-8 text-center transition-colors hover:border-accent/50"
        >
          <Upload className="h-6 w-6 text-accent" />
          <p className="text-sm text-foreground">Drop files here or click to browse</p>
          <p className="text-xs text-subtle">PDF, DOCX, PPTX, TXT · up to 20MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {isUploading && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
          </p>
        )}
        {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}

        <div className="mt-5 space-y-2">
          {documents.length === 0 ? (
            <p className="py-6 text-center text-xs text-subtle">No documents yet</p>
          ) : (
            documents.map((doc) => (
              <label
                key={doc.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors",
                  doc.status !== "ready" && "cursor-not-allowed opacity-70"
                )}
              >
                <input
                  type="checkbox"
                  disabled={doc.status !== "ready"}
                  checked={selected.has(doc.id)}
                  onChange={() => toggleSelected(doc.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-accent"
                />
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{doc.originalName}</p>
                  <StatusBadge doc={doc} />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(doc.id);
                  }}
                  className="shrink-0 text-subtle hover:text-danger"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Right: ask panel */}
      <div className="flex flex-col">
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={
              readyCount === 0
                ? "Upload and select at least one document to ask questions…"
                : selected.size === 0
                ? "Select documents on the left, then ask a question…"
                : "Ask something about your selected documents…"
            }
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-subtle">{selected.size} document{selected.size === 1 ? "" : "s"} selected</p>
            <Button onClick={handleAsk} disabled={isAsking || !question.trim() || selected.size === 0} isLoading={isAsking}>
              Ask
            </Button>
          </div>
        </div>

        {askError && <p className="mt-3 text-sm text-danger">{askError}</p>}

        <div className="mt-5 flex-1 rounded-xl border border-border bg-surface p-6">
          {!answer && !isAsking ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-subtle">
              <Sparkles className="mb-3 h-7 w-7 text-accent" />
              <p className="text-sm">Answers here are grounded only in the documents you select — no outside knowledge.</p>
            </div>
          ) : (
            <>
              <MarkdownRenderer content={answer || "…"} />
              {sources.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium text-subtle">Sources</p>
                  <ol className="space-y-1 text-xs text-subtle">
                    {sources.map((s) => (
                      <li key={`${s.documentName}-${s.chunkIndex}`}>
                        [{s.index}] {s.documentName} — excerpt {s.chunkIndex + 1}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ doc }: { doc: DocumentSummary }) {
  if (doc.status === "processing") {
    return (
      <span className="mt-1 flex items-center gap-1 text-xs text-violet">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing…
      </span>
    );
  }
  if (doc.status === "failed") {
    return (
      <span className="mt-1 flex items-center gap-1 text-xs text-danger" title={doc.errorMessage}>
        <AlertCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-success">
      <CheckCircle2 className="h-3 w-3" /> Ready · {doc.chunkCount} chunks
    </span>
  );
}
