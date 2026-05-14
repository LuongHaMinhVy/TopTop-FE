"use client";

import React from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showBorder?: boolean;
}

export const Avatar = ({ 
  src, 
  alt, 
  size = "md", 
  className = "", 
  showBorder = true 
}: AvatarProps) => {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24",
  };

  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div 
      className={`
        relative rounded-full overflow-hidden flex-shrink-0 bg-surface flex items-center justify-center
        ${sizes[size]} 
        ${showBorder ? "border-2 border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)]" : ""}
        ${className}
      `}
    >
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="object-cover"
        />
      ) : (
        <span className="text-[40%] font-bold text-text-muted">
          {initials}
        </span>
      )}
    </div>
  );
};
