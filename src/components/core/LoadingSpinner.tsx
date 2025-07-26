import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 48, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-4 border-muted border-t-primary", className)}
      style={{ width: size, height: size, borderTopColor: "var(--foodeez-primary)" }} // default primary color
    />
  );
}
