"use client";

import React, { ReactNode } from "react";

interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  isOverlay?: boolean;
  className?: string;
}

export const IconButton = ({ 
  icon, 
  label, 
  onClick, 
  active, 
  activeColor = "text-brand", 
  isOverlay = false,
  className = ""
}: IconButtonProps) => {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <button 
        onClick={onClick}
        className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group active:scale-90
          ${isOverlay 
            ? "bg-black/20 backdrop-blur-md hover:bg-black/40" 
            : "bg-surface hover:bg-hover"} 
          ${active ? activeColor : "text-text-primary"}
        `}
      >
        <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
          {icon}
        </div>
      </button>
      {label && (
        <span className={`text-[12px] font-bold ${isOverlay ? "text-white drop-shadow-md" : "text-text-secondary"}`}>
          {label}
        </span>
      )}
    </div>
  );
};
