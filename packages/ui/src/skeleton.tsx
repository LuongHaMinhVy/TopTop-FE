import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export const Skeleton = ({ className = "", variant = "rect" }: SkeletonProps) => {
  const variants = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm h-4 w-full",
  };

  return (
    <div 
      className={`
        bg-zinc-200 dark:bg-zinc-800 
        animate-pulse 
        ${variants[variant]} 
        ${className}
      `} 
    />
  );
};
