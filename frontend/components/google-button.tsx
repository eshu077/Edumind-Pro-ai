"use client";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={() => {
        window.location.href = `${API_URL}/api/auth/google`;
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.4-1.6 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.6-5.85 5.76-5.85c1.8 0 3.02.77 3.71 1.43l2.53-2.44C16.87 3.68 14.87 2.8 12.18 2.8 6.98 2.8 2.77 7 2.77 12.2s4.2 9.4 9.4 9.4c5.43 0 9.02-3.82 9.02-9.19 0-.62-.07-1.09-.15-1.31Z"
        />
      </svg>
      {label}
    </Button>
  );
}
