"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90",
    secondary: "bg-surface text-text-primary hover:bg-hover",
    outline: "border border-elevated text-text-primary hover:bg-hover",
    ghost: "text-text-secondary hover:bg-hover hover:text-text-primary",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-bold transition active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
