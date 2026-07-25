"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/chat-api";

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface/40">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-subtle">No conversations yet</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c._id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                c._id === activeId ? "bg-muted text-foreground" : "text-subtle hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <button onClick={() => onSelect(c._id)} className="flex flex-1 items-center gap-2 overflow-hidden text-left">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title || "New chat"}</span>
              </button>
              <button
                onClick={() => onDelete(c._id)}
                className="shrink-0 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
