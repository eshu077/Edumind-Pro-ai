import Link from "next/link";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center font-display text-xl font-medium text-foreground">
          EduMind <span className="text-accent">Pro</span> AI
        </Link>
        <Card className="p-8">
          <h1 className="font-display text-2xl font-medium text-foreground">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-subtle">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </Card>
        {footer ? <div className="mt-6 text-center text-sm text-subtle">{footer}</div> : null}
      </div>
    </main>
  );
}
