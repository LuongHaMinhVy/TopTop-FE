import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "brand";
  className?: string;
  size?: "sm" | "md";
};

export function Badge({
  children,
  variant = "info",
  className = "",
  size = "md",
}: BadgeProps) {
  const variants = {
    success: "bg-green-100 text-green-600",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-600",
    info: "bg-blue-100 text-blue-600",
    brand: "bg-brand/10 text-brand",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
