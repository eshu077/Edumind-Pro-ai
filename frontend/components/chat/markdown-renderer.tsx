"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { MermaidBlock } from "./mermaid-block";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match);
            const text = String(children).replace(/\n$/, "");

            if (!isBlock) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] text-accent" {...props}>
                  {children}
                </code>
              );
            }

            if (match![1] === "mermaid") {
              return <MermaidBlock code={text} />;
            }

            return <CodeBlock language={match![1]} code={text} />;
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border-b border-border bg-muted px-3 py-2 text-left font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b border-border/50 px-3 py-2">{children}</td>;
          },
          a({ children, href }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {children}
              </a>
            );
          },
          p({ children }) {
            return <p className="mb-3 leading-relaxed last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>;
          },
          h1({ children }) {
            return <h1 className="mb-3 mt-5 font-display text-xl font-medium first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="mb-2 mt-5 font-display text-lg font-medium first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="mb-2 mt-4 font-display text-base font-medium first:mt-0">{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-muted px-4 py-2 text-xs text-subtle">
        <span>{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-foreground">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.85rem", padding: "1rem" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
