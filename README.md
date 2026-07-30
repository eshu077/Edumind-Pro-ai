# EduMind Pro AI

An AI-native learning platform: an AI Tutor with live web search, RAG
over your own documents, AI-generated roadmaps, quizzes, notes, a study
planner, a career mentor, and full auth — built as a real deployable app,
phase by phase.

## What's built

- **Auth**: email/password with JWT + rotating refresh tokens, email
  verification, password reset, protected routes.
- **AI Tutor**: streaming chat (Groq), markdown + syntax-highlighted code,
  GFM tables, Mermaid diagrams, math (KaTeX), conversation memory, voice
  input and text-to-speech (both browser-native, no key needed), and
  automatic routing to live web search (Tavily) when a question needs
  current information, with cited sources.
- **Documents (RAG)**: upload PDF/DOCX/PPTX/TXT, extract + chunk + embed
  locally (no extra API key), ask questions answered strictly from the
  documents you select, with numbered citations.
- **AI Roadmap Generator**: a structured study plan (weekly schedule,
  milestones with projects, resources) from a subject, difficulty,
  duration, and goals — checkable tasks, live progress bar, and a
  certificate on completion.
- **Knowledge Check**: AI-generated quizzes (MCQ, true/false,
  fill-in-the-blank, short conceptual questions), graded server-side with
  explanations, unlimited retries, a personal performance summary, and a
  certificate after a submitted attempt.
- **AI Notes**: notes, cheat sheets, summaries, mind-map outlines,
  interview Q&A, and flashcards — from a topic or grounded in an uploaded
  document — exportable as Markdown or PDF (client-side).
- **Study Planner**: a day-view task list with a real streak counter and
  XP that update as you complete tasks.
- **Career Mentor**: target role + current skills + experience level in,
  skill gaps + recommended roles + an action plan + resources out.
- **Admin Dashboard**: platform stats and a user table, gated to
  `role: "admin"`.
- **Settings**: display name and a Cloudinary-hosted avatar upload.

## What's not included

Being direct about the gap from the original all-in-one request:

- **Resume Analyzer with ATS score, Mock Interview, AI Project Generator**
- **A cross-user quiz leaderboard** — quizzes track your own best
  attempts, ranked; each generated quiz is unique to that generation, so
  a real shared leaderboard would need a canonical quiz bank
- **Bookmarks / Favorite chats / Search history** as dedicated pages
  (conversation history already lives inside the AI Tutor)
- **A code execution / coding playground feature** — intentionally left
  out
- **Google OAuth login** — intentionally left out to keep setup simple
  (email/password + email verification covers auth)
- Raw document storage — uploaded documents are processed to
  text/embeddings only, never persisted as files; Cloudinary is used only
  for avatars

## 1. Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine)
- An email account you can send SMTP mail from (Gmail + an "app password" works)
- A free Groq API key: https://console.groq.com/keys
- A free Tavily API key: https://app.tavily.com
- A free Cloudinary account (for avatar uploads): https://cloudinary.com

## 2. MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com
2. Database Access → add a database user with a password
3. Network Access → add `0.0.0.0/0` for now (or your IP)
4. Copy the connection string into `backend/.env` as `MONGO_URI`

## 3. Email (SMTP)

If using Gmail: enable 2FA on the account, then create an "App Password"
(Google Account → Security → App passwords) and use that as `SMTP_PASS`.

## 4. Groq + Tavily

1. Groq: sign up at https://console.groq.com/keys, create a key, put it in
   `backend/.env` as `GROQ_API_KEY`.
2. Tavily: sign up at https://app.tavily.com, copy your key into
   `backend/.env` as `TAVILY_API_KEY`.

Without `GROQ_API_KEY`, the AI Tutor, Documents Q&A, Roadmap Generator,
Knowledge Check, Notes, and Career Mentor will all fail — check the
backend console, it logs a clear warning if the key is missing. Tavily is
only used by the AI Tutor's web-search routing.

## 5. Documents / RAG — no extra key needed

Embeddings run locally via `@xenova/transformers` (no external embeddings
API or key required). The first time you upload a document, the backend
downloads a small (~90MB) embedding model and caches it — that first
upload will be noticeably slower than the rest. Text extraction for
PDF/DOCX/PPTX goes through `officeparser`; `.txt` is read directly.

If a document shows "Failed" in the library, hover it to see the error —
usually an unsupported/corrupted file or one with no extractable text
(e.g. a scanned PDF with no text layer, which would need OCR — not
included).

## 6. Cloudinary (avatar uploads)

1. Sign up free at https://cloudinary.com, go to the Dashboard.
2. Copy **Cloud name**, **API Key**, and **API Secret** into `backend/.env`
   as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Without these, everything else works fine — only the avatar upload button
in Settings returns a clean "not configured" error until you add them.

## 7. Making yourself an admin

There's no in-app "promote to admin" button on purpose — that would be a
privilege-escalation hole. To get admin access:

1. Sign up normally through the app.
2. In MongoDB Atlas, open your cluster → Browse Collections → the `users`
   collection → find your user document → edit it → change `role` from
   `"student"` to `"admin"` → save.
3. Log out and back in (or just refresh after your token refreshes) — the
   Admin link appears in the sidebar once your session picks up the new role.

## 8. Local setup

```bash
# Backend
cd backend
cp .env.example .env   # then fill in the real values
npm install
npm run dev             # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev              # http://localhost:3000
```

Visit `http://localhost:3000`, sign up, check your inbox for the
verification email, verify, then log in. From the dashboard sidebar:
AI Tutor for general chat (mic + Listen buttons included), Documents for
grounded Q&A, Roadmaps for a study plan, Knowledge Check for quizzes,
AI Notes for notes/flashcards/cheat sheets, Study Planner for daily
tasks and streaks, Career Mentor for a skills action plan, and Settings
for your profile photo and name.

## 9. Deploying

**Backend → Render**
- New Web Service → connect this repo, root directory `backend`
- Render reads `render.yaml` automatically (Blueprint), or set manually:
  Build command `npm install`, start command `npm start`
- Add the env vars from `backend/.env.example` in the Render dashboard —
  `render.yaml` already generates `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`
  for you, but `MONGO_URI`, `GROQ_API_KEY`, `TAVILY_API_KEY`,
  `CLOUDINARY_*`, and SMTP values need to be pasted in manually — set
  `CLIENT_URL` to a placeholder for now (you'll update it below once
  Vercel gives you the frontend URL).
- Render's free tier has limited RAM — if document processing crashes the
  dyno, bump to a paid instance type; the embedding model needs a few
  hundred MB headroom.

**Frontend → Vercel**
- Import this repo, root directory `frontend`
- Framework preset: Next.js (auto-detected via `vercel.json`)
- Add `NEXT_PUBLIC_API_URL` = your Render backend URL
- Deploy

Once both are live, go back to Render and set `CLIENT_URL` to your real
Vercel URL, then redeploy the backend — CORS and cookies depend on this
matching exactly.

In MongoDB Atlas, Network Access should already allow `0.0.0.0/0` from
local setup — that also covers Render's dynamic IPs, so no change needed
there.

**Smoke-test in this order once both are live**: sign up → verify email
→ log in → AI Tutor sends a message (try the mic + Listen buttons) →
upload a document in Documents → generate a roadmap → generate a quiz →
generate a note → add a task in the Study Planner → generate a Career
Mentor plan → upload an avatar in Settings → (optionally) promote
yourself to admin and check the Admin Dashboard. That exercises every
external API key at least once.

Render's free tier spins down after inactivity — the first request after
idle can take 30-60s to wake up.

## 10. How the AI Tutor routes Groq vs Tavily

`backend/src/utils/providerRouter.js` checks the message against a keyword
pattern (latest, recent, today, news, current year, etc). Matches go
through Tavily first — the search results get folded into the system
prompt with numbered citations, then Groq streams the final answer over
that context. Everything else goes straight to Groq. If routing feels
wrong in practice, that heuristic is the one place to tune.

## 11. How RAG retrieval works

`backend/src/controllers/documentController.js`: each uploaded file is
chunked (~800 chars, 150 overlap) and every chunk gets a local embedding
vector stored in MongoDB alongside the raw chunk text. Asking a question
embeds the question the same way, scores every chunk in the selected
documents by cosine similarity (brute-force, in Node), takes the top 6,
and feeds them to Groq as numbered context with a system prompt that
forbids answering from outside knowledge. This is intentionally simple —
fine for a personal study library. If you outgrow brute-force search,
MongoDB Atlas Vector Search is the natural upgrade path.

## 12. How roadmap generation works

`backend/src/controllers/roadmapController.js` prompts Groq with
`response_format: { type: "json_object" }` and a strict schema (weekly
schedule, milestones, resources), parses and normalizes the result, and
stores it. Generation runs in the background — the roadmap shows a
"Generating…" card in the list until it's ready, polling every 3s. Each
task gets its own Mongo subdocument id so checking it off updates a live
progress percentage without regenerating anything. At 100% progress a
"Download certificate" button appears (client-side PDF, no backend
involvement). If a generation fails, the card shows "failed" with a
delete option — just try again.

## 13. How Knowledge Check works — and its one honest limitation

`backend/src/controllers/quizController.js` generates a quiz the same way
roadmaps are generated (Groq JSON mode), then strips answers before
sending it to the client so they can't be read from the network tab —
grading happens server-side on submit, and answers/explanations only come
back after you submit. MCQ, true/false, and fill-in-the-blank are graded
by exact (normalized) string match. "Coding/conceptual" questions are
graded by keyword overlap against a reference answer — this project
doesn't include a code execution sandbox, so exact code correctness isn't
verified for that question type.

The "leaderboard" is your own best attempts per quiz, ranked highest
first — not a cross-user leaderboard (see "What's not included" above).
A certificate button appears after any submitted attempt.

## 14. How the AI Notes Generator works

`backend/src/controllers/noteController.js` generates plain markdown for
notes/cheatsheet/summary/mind_map/interview_questions, and structured
JSON (via `response_format: json_object`) for flashcards. If you pick a
document to base it on, the document's extracted text (capped at ~6000
characters) is prepended as context — the model is told to base its
answer primarily on that, but unlike the strict Documents/RAG mode, this
is generative, not citation-locked. Markdown and PDF export both happen
**client-side** (`frontend/lib/export.ts`, using `jspdf`) — no backend
work or extra dependency needed for exporting, and no export ever leaves
your browser.

## 15. How the rest works

- **Study Planner** (`backend/src/controllers/plannerController.js`):
  tasks are keyed by a plain `"YYYY-MM-DD"` date string. Streak is
  recomputed from scratch on every toggle by walking backward from today
  through consecutive days that have at least one completed task — simple
  and always correct rather than an incremental counter that could drift.
  XP is +5 per task completed, -5 if you uncheck it.
- **Admin Dashboard**: `requireRole("admin")` middleware gates
  `/api/admin/*`. There's deliberately no in-app way to promote
  yourself — see section 8 above for how to do it via MongoDB Atlas.
- **Certificates**: generated entirely client-side with `jsPDF`
  (`downloadCertificate` in `frontend/lib/export.ts`) — no backend
  involvement, no stored certificate record.
- **Voice input / TTS**: both use the browser's native Web Speech API
  (`SpeechRecognition` / `speechSynthesis`) — zero cost, zero backend
  changes, but browser support varies (works in Chrome/Edge; Safari/
  Firefox support is inconsistent). The mic button only renders if
  `window.SpeechRecognition` is actually available.
- **Mermaid + math**: `remark-math` + `rehype-katex` handle LaTeX inline
  in the shared `MarkdownRenderer`; a dedicated `MermaidBlock` component
  intercepts ` ```mermaid ` code fences and renders them as SVG via the
  `mermaid` package, lazy-loaded on first use.
- **Cloudinary avatars**: `backend/src/config/cloudinary.js` uploads
  through `uploader.upload_stream` (buffer straight from Multer memory
  storage, never touches disk), resized/cropped to a 256×256 face-focused
  thumbnail. Same "warn, don't crash" pattern as every other optional
  integration in this project if the keys are missing.
- **Career Mentor**: same Groq JSON-mode pattern as Roadmaps and
  Knowledge Check — one generation call, normalized and stored, polled
  from the frontend until ready.

## 16. Project structure

```
backend/
  src/
    config/       # db, passport, groq, cloudinary
    controllers/   # one per feature
    middleware/    # auth, upload, error handling
    models/        # mongoose schemas
    routes/         # express routers
    utils/          # chunking, embeddings, text extraction, provider routing
frontend/
  app/
    (auth)/          # login, signup, password reset, verify-email
    dashboard/        # every feature page, one folder each
  components/         # shared UI (button, card, markdown renderer, etc.)
  lib/                 # one API client module per feature
```
