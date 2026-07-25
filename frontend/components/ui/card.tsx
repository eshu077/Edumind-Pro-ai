import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface/80 backdrop-blur-sm shadow-xl shadow-black/20",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
