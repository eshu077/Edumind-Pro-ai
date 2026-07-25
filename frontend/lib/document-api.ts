import { apiFetch, API_URL } from "./api";
import { useAuthStore } from "./auth-store";

export interface DocumentSummary {
  id: string;
  originalName: string;
  fileType: string;
  status: "processing" | "ready" | "failed";
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
}

export async function listDocuments() {
  const data = await apiFetch<{ documents: DocumentSummary[] }>("/api/documents");
  return data.documents;
}

export async function getDocument(id: string) {
  const data = await apiFetch<{ document: DocumentSummary }>(`/api/documents/${id}`);
  return data.document;
}

export async function deleteDocument(id: string) {
  await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
}

// Multipart upload can't go through apiFetch's JSON-only wrapper — the
// browser needs to set the multipart boundary itself, so no Content-Type header here.
export async function uploadDocument(file: File): Promise<DocumentSummary> {
  const token = useAuthStore.getState().accessToken;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/documents`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `Upload failed with status ${res.status}`);
  return body.document;
}

export interface RagSource {
  index: number;
  documentName: string;
  chunkIndex: number;
}

interface AskHandlers {
  onSources?: (sources: RagSource[]) => void;
  onToken?: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export async function streamAsk(documentIds: string[], question: string, handlers: AskHandlers) {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/api/documents/ask`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ documentIds, question }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    handlers.onError?.(body?.message || `Request failed with status ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const eventLine = frame.split("\n").find((l) => l.startsWith("event:"));
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());

      if (event === "sources") handlers.onSources?.(data.sources);
      if (event === "token") handlers.onToken?.(data.text);
      if (event === "done") handlers.onDone?.();
      if (event === "error") handlers.onError?.(data.message);
    }
  }
}
