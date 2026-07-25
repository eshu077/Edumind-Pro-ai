"use client";

import { useEffect, useRef, useState } from "react";

let mermaidPromise: Promise<any> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({ startOnLoad: false, theme: "dark" });
      return m.default;
    });
  }
  return mermaidPromise;
}

export function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then(async (mermaid) => {
        try {
          const { svg } = await mermaid.render(idRef.current, code);
          if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg;
        } catch {
          if (!cancelled) setError("Couldn't render this diagram — check the Mermaid syntax.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the diagram renderer.");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return <pre className="my-4 whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs text-danger">{error}</pre>;
  }

  return <div ref={containerRef} className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-surface p-4" />;
}
