import React, { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "brand";
  className?: string;
  size?: "sm" | "md";
}

export const Badge = ({ 
  children, 
  variant = "info", 
  className = "",
  size = "md" 
}: BadgeProps) => {
  const variants = {
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    error: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    brand: "bg-brand/10 text-brand",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
