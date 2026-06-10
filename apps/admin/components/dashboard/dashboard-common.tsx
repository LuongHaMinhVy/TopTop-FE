import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@repo/ui";

export type StatItem = {
  label: string;
  value: string;
  hint: string;
  icon: ElementType;
  tone: string;
};

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-elevated bg-background ${className}`}>
      <div className="flex flex-col gap-4 border-b border-elevated p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, icon: Icon, tone }: StatItem) {
  return (
    <div className="rounded-lg border border-elevated bg-background p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Activity className="h-4 w-4 text-text-muted" />
      </div>
      <p className="text-sm font-bold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 text-text-muted">{hint}</p>
    </div>
  );
}

export function IconActionButton({
  label,
  icon: Icon,
  variant = "secondary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ElementType;
  variant?: "secondary" | "ghost" | "danger" | "primary" | "outline";
  isLoading?: boolean;
}) {
  const variants = {
    primary: "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90",
    secondary: "bg-surface text-text-primary hover:bg-hover",
    outline: "border border-elevated text-text-primary hover:bg-hover",
    ghost: "text-text-secondary hover:bg-hover hover:text-text-primary",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
  };

  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || isLoading}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-elevated bg-surface p-8 text-center">
      <Icon className="h-8 w-8 text-text-muted" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-text-muted">{detail}</p>
    </div>
  );
}

export function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-surface" />
      ))}
    </div>
  );
}

export function TopTopMark() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
      <span className="absolute z-10 text-2xl font-extrabold italic tracking-tighter text-white">
        t
      </span>
      <span className="absolute -translate-x-px -translate-y-px text-2xl font-extrabold italic tracking-tighter text-cyan">
        t
      </span>
      <span className="absolute translate-x-px translate-y-px text-2xl font-extrabold italic tracking-tighter text-brand">
        t
      </span>
    </div>
  );
}
