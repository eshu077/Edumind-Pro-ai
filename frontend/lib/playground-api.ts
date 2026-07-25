import { apiFetch } from "./api";

export type PlaygroundLanguage = "python" | "java" | "cpp" | "javascript" | "c";

export const LANGUAGE_OPTIONS: { value: PlaygroundLanguage; label: string; monacoId: string }[] = [
  { value: "python", label: "Python 3", monacoId: "python" },
  { value: "javascript", label: "JavaScript", monacoId: "javascript" },
  { value: "java", label: "Java", monacoId: "java" },
  { value: "cpp", label: "C++", monacoId: "cpp" },
  { value: "c", label: "C", monacoId: "c" },
];

export const DEFAULT_SNIPPETS: Record<PlaygroundLanguage, string> = {
  python: 'print("Hello, EduMind!")\n',
  javascript: 'console.log("Hello, EduMind!");\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, EduMind!");\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, EduMind!" << endl;\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, EduMind!\\n");\n    return 0;\n}\n',
};

export interface RunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  status: string;
  time: string | null;
  memory: number | null;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestResult extends TestCase {
  actualOutput: string;
  stderr: string;
  compileOutput: string;
  status: string;
  passed: boolean;
}

export interface SnippetSummary {
  _id: string;
  title: string;
  language: PlaygroundLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet extends SnippetSummary {
  code: string;
}

export async function runCode(language: PlaygroundLanguage, code: string, stdin: string) {
  const data = await apiFetch<{ result: RunResult }>("/api/playground/run", {
    method: "POST",
    body: JSON.stringify({ language, code, stdin }),
  });
  return data.result;
}

export async function runTestCases(language: PlaygroundLanguage, code: string, testCases: TestCase[]) {
  const data = await apiFetch<{ results: TestResult[] }>("/api/playground/run-tests", {
    method: "POST",
    body: JSON.stringify({ language, code, testCases }),
  });
  return data.results;
}

export async function saveSnippet(language: PlaygroundLanguage, code: string, title: string) {
  const data = await apiFetch<{ snippet: Snippet }>("/api/playground/snippets", {
    method: "POST",
    body: JSON.stringify({ language, code, title }),
  });
  return data.snippet;
}

export async function listSnippets() {
  const data = await apiFetch<{ snippets: SnippetSummary[] }>("/api/playground/snippets");
  return data.snippets;
}

export async function getSnippet(id: string) {
  const data = await apiFetch<{ snippet: Snippet }>(`/api/playground/snippets/${id}`);
  return data.snippet;
}

export async function deleteSnippet(id: string) {
  await apiFetch(`/api/playground/snippets/${id}`, { method: "DELETE" });
}
