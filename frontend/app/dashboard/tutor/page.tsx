"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Search, Sparkles, Mic, MicOff } from "lucide-react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { cn } from "@/lib/utils";
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  streamMessage,
  type ConversationSummary,
  type ChatMessage,
} from "@/lib/chat-api";

export default function AiTutorPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeProvider, setActiveProvider] = useState<"groq" | "tavily" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function refreshConversations() {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch {
      // Sidebar list failing isn't fatal — the chat itself still works.
    }
  }

  async function handleSelect(id: string) {
    setActiveId(id);
    setError(null);
    const conversation = await getConversation(id);
    setMessages(conversation.messages);
  }

  async function handleNew() {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (id === activeId) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isStreaming) return;

    setError(null);
    setInput("");
    setIsStreaming(true);
    setActiveProvider(null);

    let conversationId = activeId;
    if (!conversationId) {
      const conversation = await createConversation();
      conversationId = conversation._id;
      setActiveId(conversationId);
    }

    setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "" }]);

    await streamMessage(conversationId, content, {
      onProvider: (provider) => setActiveProvider(provider),
      onSources: (sources) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], sources };
          return next;
        });
      },
      onToken: (text) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + text };
          return next;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        setActiveProvider(null);
        refreshConversations();
      },
      onError: (message) => {
        setError(message);
        setIsStreaming(false);
        setActiveProvider(null);
      },
    });
  }

  return (
    <div className="flex h-[calc(100vh-0px)] -m-6 md:-m-10">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="font-display text-lg font-medium text-foreground">AI Tutor</h1>
            <p className="text-xs text-subtle">Remembers this conversation · searches the web when it needs to</p>
          </div>
          {activeProvider === "tavily" && (
            <span className="flex items-center gap-1.5 rounded-full bg-violet/15 px-3 py-1 text-xs text-violet">
              <Search className="h-3 w-3" /> Searching the web
            </span>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-8 w-8 text-accent" />
              <h2 className="font-display text-xl font-medium text-foreground">Ask anything from your syllabus.</h2>
              <p className="mt-1 max-w-sm text-sm text-subtle">
                Or ask what's new in a framework or field — the tutor searches the web automatically when a question needs current info.
              </p>
            </div>
          ) : (
            messages.map((m, i) => <MessageBubble key={i} message={m} />)
          )}
        </div>

        {error && <p className="px-6 pb-2 text-sm text-danger">{error}</p>}

        <div className="border-t border-border p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-xl border border-border bg-surface px-3 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your AI Tutor…"
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none"
            />
            {speech.supported && (
              <button
                onClick={() => (speech.isListening ? speech.stop() : speech.start())}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  speech.isListening
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-border text-subtle hover:text-foreground"
                )}
                aria-label={speech.isListening ? "Stop voice input" : "Start voice input"}
                type="button"
              >
                {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
