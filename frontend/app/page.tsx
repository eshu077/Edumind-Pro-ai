"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpenText,
  Compass,
  BrainCircuit,
  Briefcase,
  NotebookPen,
  CalendarClock,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Tutor",
    body: "A streaming, citation-aware tutor that remembers your conversation and explains at your level.",
  },
  {
    icon: Compass,
    title: "AI Roadmaps",
    body: "Personalized study paths with milestones, weekly goals, and curated resources for any subject.",
  },
  {
    icon: BookOpenText,
    title: "Knowledge Check",
    body: "Adaptive quizzes — MCQs, true/false, and fill-in-the-blank — with instant, worked explanations.",
  },
  {
    icon: Briefcase,
    title: "Career Mentor",
    body: "Skill gaps, recommended roles, and an ordered action plan for wherever you're trying to go.",
  },
  {
    icon: NotebookPen,
    title: "AI Notes",
    body: "Turn any topic or document into notes, flashcards, cheat sheets, and mind maps in seconds.",
  },
  {
    icon: CalendarClock,
    title: "Study Planner",
    body: "Daily and weekly plans that adapt to your streaks, goals, and how much time you actually have.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <Nav />

      {/* Hero */}
      <section className="container relative pt-28 pb-24 md:pt-36 md:pb-32">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-sm font-medium tracking-wide text-violet"
        >
          The AI study desk
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl font-display text-5xl font-medium leading-[1.3] text-foreground md:text-6xl"
        >
          Study like someone is{" "}
          <span className="highlight-mark bg-clip-content text-background animate-highlight-sweep">
            reading alongside you
          </span>
          .
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-subtle"
        >
          EduMind Pro AI turns tutoring, roadmaps, quizzes, notes, and career
          guidance into one workspace — built for people who actually have
          exams and deadlines.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Button size="lg" asChild>
            <Link href="/signup">Start learning free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I have an account</Link>
          </Button>
        </motion.div>

        {/* Signature element: floating "study nodes" evoking a mind-map / annotated page */}
        <div aria-hidden className="pointer-events-none absolute right-[-60px] top-16 hidden w-[420px] lg:block">
          <FloatingNode label="Neural Networks" x={0} y={0} delay={0} />
          <FloatingNode label="Chapter 4 quiz — 92%" x={140} y={90} delay={0.4} />
          <FloatingNode label="Roadmap: Day 12 of 30" x={20} y={200} delay={0.8} />
        </div>
      </section>

      {/* Feature grid */}
      <section className="container pb-28">
        <div className="mb-12 max-w-xl">
          <h2 className="font-display text-3xl font-medium text-foreground">
            Everything on your desk, none of the tabs.
          </h2>
          <p className="mt-3 text-subtle">
            Six tools, one account, one conversation with your own progress.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <Card className="h-full p-6">
                <f.icon className="mb-4 h-6 w-6 text-accent" />
                <h3 className="font-display text-lg font-medium text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-28">
        <Card className="flex flex-col items-start justify-between gap-6 p-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-2xl font-medium text-foreground">
              Your first roadmap is free to generate.
            </h3>
            <p className="mt-2 text-subtle">No credit card. Verify your email and go.</p>
          </div>
          <Button size="lg" asChild>
            <Link href="/signup">Create your account</Link>
          </Button>
        </Card>
      </section>

      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="container flex items-center justify-between py-6">
      <Link href="/" className="font-display text-xl font-medium text-foreground">
        EduMind <span className="text-accent">Pro</span> AI
      </Link>
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-surface/60 px-6 py-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet font-display text-base font-medium text-background">
              ES
            </div>
            <div>
              <p className="text-sm text-subtle">
                Built by <span className="font-display font-medium text-foreground">Eshu Sharma</span>
              </p>
              <a
                href="mailto:eshu6399921101@gmail.com"
                className="text-xs text-accent transition-colors hover:underline"
              >
                eshu6399921101@gmail.com
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              B.Tech CSE (AI &amp; ML)
            </span>
            <span className="rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">
              Full-Stack · AI/ML
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-subtle md:flex-row">
          <p>© {new Date().getFullYear()} EduMind Pro AI. Built for people with deadlines.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingNode({ label, x, y, delay }: { label: string; x: number; y: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className="absolute animate-float rounded-xl border border-border bg-surface/90 px-4 py-2.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm"
      style={{ left: x, top: y, animationDelay: `${delay}s` }}
    >
      {label}
    </motion.div>
  );
}
