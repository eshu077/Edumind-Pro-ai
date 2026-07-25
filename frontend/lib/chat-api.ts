import { apiFetch, API_URL } from "./api";
import { useAuthStore } from "./auth-store";

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  provider?: "groq" | "tavily";
  sources?: ChatSource[];
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function listConversations() {
  const data = await apiFetch<{ conversations: ConversationSummary[] }>("/api/chat/conversations");
  return data.conversations;
}

export async function createConversation() {
  const data = await apiFetch<{ conversation: Conversation }>("/api/chat/conversations", { method: "POST" });
  return data.conversation;
}

export async function getConversation(id: string) {
  const data = await apiFetch<{ conversation: Conversation }>(`/api/chat/conversations/${id}`);
  return data.conversation;
}

export async function deleteConversation(id: string) {
  await apiFetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
}

interface StreamHandlers {
  onProvider?: (provider: "groq" | "tavily") => void;
  onSources?: (sources: ChatSource[]) => void;
  onToken?: (text: string) => void;
  onDone?: (title: string) => void;
  onError?: (message: string) => void;
}

// Manual SSE parsing over fetch, since EventSource can't send an Authorization
// header or a POST body. Parses "event: x\ndata: {...}\n\n" frames as they arrive.
export async function streamMessage(conversationId: string, content: string, handlers: StreamHandlers) {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
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

      if (event === "provider") handlers.onProvider?.(data.provider);
      if (event === "sources") handlers.onSources?.(data.sources);
      if (event === "token") handlers.onToken?.(data.text);
      if (event === "done") handlers.onDone?.(data.title);
      if (event === "error") handlers.onError?.(data.message);
    }
  }
}
