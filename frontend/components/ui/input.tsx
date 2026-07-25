import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
