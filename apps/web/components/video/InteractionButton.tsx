import React from "react";

interface InteractionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  isOverlay?: boolean;
}

export function InteractionButton({ 
  icon, 
  label, 
  onClick, 
  active, 
  activeColor = "", 
  isOverlay = false 
}: InteractionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={onClick}
        className={`w-11 lg:w-12 h-11 lg:h-12 rounded-full flex items-center justify-center transition-colors shadow-sm
          ${isOverlay ? "bg-black/20 backdrop-blur-md" : "bg-white/10 hover:bg-white/20"} 
          ${active ? activeColor : "text-white"}`}
      >
        {icon}
      </button>
      <span className={`text-[12px] font-bold ${isOverlay ? "text-white drop-shadow-md" : "text-white/80"}`}>{label}</span>
    </div>
  );
}
