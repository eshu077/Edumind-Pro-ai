"use client";

import { useState } from "react";
import { Check, Copy, Globe, User, Volume2, VolumeX } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import type { ChatMessage } from "@/lib/chat-api";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isUser = message.role === "user";

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSpeak() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    // Strip common markdown syntax so it doesn't read out symbols aloud.
    const plainText = message.content.replace(/[#*`_>[\]()-]/g, " ").replace(/\s+/g, " ");
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-2">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-violet px-4 py-3 text-sm text-violet-foreground">
          {message.content}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-subtle" />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 px-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        AI
      </div>
      <div className="max-w-[85%] flex-1">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm text-foreground">
          <MarkdownRenderer content={message.content || "…"} />

          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-subtle">
                <Globe className="h-3.5 w-3.5" /> Sources
              </p>
              <ol className="space-y-1 text-xs">
                {message.sources.map((s, i) => (
                  <li key={s.url}>
                    <span className="text-subtle">[{i + 1}]</span>{" "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {message.content && (
          <div className="mt-1.5 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-subtle hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy response"}
            </button>
            <button
              onClick={handleSpeak}
              className="flex items-center gap-1.5 text-xs text-subtle hover:text-foreground"
            >
              {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {speaking ? "Stop" : "Listen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
