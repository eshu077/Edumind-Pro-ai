"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Loader2,
  Save,
  FolderOpen,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  runCode,
  runTestCases,
  saveSnippet,
  listSnippets,
  getSnippet,
  deleteSnippet,
  LANGUAGE_OPTIONS,
  DEFAULT_SNIPPETS,
  type PlaygroundLanguage,
  type RunResult,
  type TestCase,
  type TestResult,
  type SnippetSummary,
} from "@/lib/playground-api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Tab = "output" | "tests";

export default function PlaygroundPage() {
  const [language, setLanguage] = useState<PlaygroundLanguage>("python");
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [stdin, setStdin] = useState("");
  const [tab, setTab] = useState<Tab>("output");

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "" }]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const [snippets, setSnippets] = useState<SnippetSummary[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSnippets()
      .then(setSnippets)
      .catch(() => {});
  }, []);

  function handleLanguageChange(lang: PlaygroundLanguage) {
    setLanguage(lang);
    setCode(DEFAULT_SNIPPETS[lang]);
    setResult(null);
    setTestResults(null);
  }

  async function handleRun() {
    setError(null);
    setIsRunning(true);
    setTab("output");
    try {
      const r = await runCode(language, code, stdin);
      setResult(r);
    } catch (err: any) {
      setError(err.message || "Run failed");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunTests() {
    const validCases = testCases.filter((tc) => tc.expectedOutput.trim());
    if (validCases.length === 0) {
      setError("Add at least one test case with an expected output.");
      return;
    }
    setError(null);
    setIsRunningTests(true);
    setTab("tests");
    try {
      const results = await runTestCases(language, code, validCases);
      setTestResults(results);
    } catch (err: any) {
      setError(err.message || "Test run failed");
    } finally {
      setIsRunningTests(false);
    }
  }

  async function handleSave() {
    const title = window.prompt("Snippet title", `${language} snippet`);
    if (!title) return;
    const snippet = await saveSnippet(language, code, title);
    setSnippets((prev) => [{ ...snippet }, ...prev]);
  }

  async function handleLoadSnippet(id: string) {
    const snippet = await getSnippet(id);
    setLanguage(snippet.language);
    setCode(snippet.code);
    setShowSnippets(false);
    setResult(null);
    setTestResults(null);
  }

  async function handleDeleteSnippet(id: string) {
    await deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s._id !== id));
  }

  function updateTestCase(index: number, field: keyof TestCase, value: string) {
    setTestCases((prev) => prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)));
  }

  return (
    <div className="flex h-[calc(100vh-0px)] -m-6 flex-col md:-m-10">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as PlaygroundLanguage)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowSnippets((v) => !v)}>
              <FolderOpen className="h-3.5 w-3.5" />
              Snippets
            </Button>
            {showSnippets && (
              <div className="absolute left-0 top-11 z-10 w-72 rounded-lg border border-border bg-surface shadow-xl">
                {snippets.length === 0 ? (
                  <p className="p-4 text-center text-xs text-subtle">No saved snippets yet</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {snippets.map((s) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-muted"
                      >
                        <button onClick={() => handleLoadSnippet(s._id)} className="flex-1 truncate text-left text-foreground">
                          {s.title}{" "}
                          <span className="text-xs capitalize text-subtle">· {s.language}</span>
                        </button>
                        <button onClick={() => handleDeleteSnippet(s._id)} className="text-subtle hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRunTests} isLoading={isRunningTests}>
            Run tests
          </Button>
          <Button size="sm" onClick={handleRun} isLoading={isRunning}>
            <Play className="h-3.5 w-3.5" />
            Run
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
        <div className="border-b border-border md:border-b-0 md:border-r">
          <MonacoEditor
            height="100%"
            language={LANGUAGE_OPTIONS.find((o) => o.value === language)?.monacoId}
            value={code}
            onChange={(v) => setCode(v || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            <TabButton active={tab === "output"} onClick={() => setTab("output")} label="Output" />
            <TabButton active={tab === "tests"} onClick={() => setTab("tests")} label="Test cases" />
          </div>

          {tab === "output" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-border p-4">
                <label className="mb-1.5 block text-xs font-medium text-subtle">Custom input (stdin)</label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  rows={3}
                  placeholder="Optional — fed to your program's stdin"
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {error && <p className="mb-3 text-sm text-danger">{error}</p>}
                {isRunning ? (
                  <p className="flex items-center gap-2 text-sm text-subtle">
                    <Loader2 className="h-4 w-4 animate-spin" /> Running…
                  </p>
                ) : result ? (
                  <div className="space-y-3 font-mono text-xs">
                    <StatusLine status={result.status} time={result.time} memory={result.memory} />
                    {result.stdout && <OutputBlock label="stdout" content={result.stdout} />}
                    {result.stderr && <OutputBlock label="stderr" content={result.stderr} tone="danger" />}
                    {result.compileOutput && <OutputBlock label="compile output" content={result.compileOutput} tone="danger" />}
                    {!result.stdout && !result.stderr && !result.compileOutput && (
                      <p className="text-subtle">(no output)</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-subtle">Run your code to see output here.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              {error && <p className="mb-3 text-sm text-danger">{error}</p>}

              <div className="space-y-3">
                {testCases.map((tc, i) => {
                  const result = testResults?.[i];
                  return (
                    <Card key={i} className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-subtle">Test {i + 1}</p>
                        <div className="flex items-center gap-2">
                          {result && (
                            result.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-danger" />
                            )
                          )}
                          {testCases.length > 1 && (
                            <button
                              onClick={() => setTestCases((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-subtle hover:text-danger"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] text-subtle">Input</label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(i, "input", e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-subtle">Expected output</label>
                          <textarea
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </div>
                      </div>
                      {result && !result.passed && (
                        <p className="mt-2 font-mono text-[11px] text-danger">Got: {result.actualOutput || "(empty)"}</p>
                      )}
                    </Card>
                  );
                })}
              </div>

              <button
                onClick={() => setTestCases((prev) => [...prev, { input: "", expectedOutput: "" }])}
                className="mt-3 flex items-center gap-1.5 self-start text-xs text-accent hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add test case
              </button>

              {testResults && (
                <p className="mt-4 text-sm text-foreground">
                  {testResults.filter((r) => r.passed).length}/{testResults.length} passed
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-accent text-foreground" : "border-transparent text-subtle hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function StatusLine({ status, time, memory }: { status: string; time: string | null; memory: number | null }) {
  const isOk = status === "Accepted";
  return (
    <p className={cn("flex items-center gap-2 font-sans text-sm font-medium", isOk ? "text-success" : "text-danger")}>
      {isOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {status}
      {time && <span className="font-normal text-subtle">· {time}s</span>}
      {memory != null && <span className="font-normal text-subtle">· {memory}KB</span>}
    </p>
  );
}

function OutputBlock({ label, content, tone }: { label: string; content: string; tone?: "danger" }) {
  return (
    <div>
      <p className={cn("mb-1 font-sans text-[10px] uppercase tracking-wide", tone === "danger" ? "text-danger" : "text-subtle")}>
        {label}
      </p>
      <pre className={cn("whitespace-pre-wrap rounded-lg border border-border bg-background p-3", tone === "danger" && "text-danger")}>
        {content}
      </pre>
    </div>
  );
}
