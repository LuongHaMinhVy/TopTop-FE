"use client";

import React from "react";

import { X } from "lucide-react";

export function Logo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) {
  const sizes = {
    sm: { container: "w-8 h-8 rounded-[10px]", font: "text-lg", offset: "1.2px" },
    md: { container: "w-11 h-11 rounded-[14px]", font: "text-2xl", offset: "1.8px" },
    lg: { container: "w-14 h-14 rounded-[18px]", font: "text-3xl", offset: "2.4px" }
  };
  const s = sizes[size];
  
  return (
    <div className={`${s.container} flex items-center justify-center shadow-xl relative overflow-hidden group flex-shrink-0 bg-background border border-elevated transition-all duration-500 hover:rotate-6 hover:scale-110 ${className}`}>
      <span className={`text-text-primary font-black ${s.font} italic tracking-tighter absolute z-10 select-none`}>t</span>
      <span className={`text-[#25F4EE] font-black ${s.font} italic tracking-tighter absolute z-0 select-none animate-pulse`} style={{ transform: `translate(-${s.offset}, -${s.offset})` }}>t</span>
      <span className={`text-[#FE2C55] font-black ${s.font} italic tracking-tighter absolute z-0 select-none animate-pulse`} style={{ transform: `translate(${s.offset}, ${s.offset})` }}>t</span>
      
      {/* Glitch effect on hover */}
      <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

export function labelStyle(collapsed: boolean, w: number, ml: number): React.CSSProperties {
  return {
    opacity: collapsed ? 0 : 1,
    width: collapsed ? 0 : w,
    marginLeft: collapsed ? 0 : ml,
    overflow: "hidden",
    whiteSpace: "nowrap",
    transition: "opacity 180ms ease, width 300ms cubic-bezier(0.4,0,0.2,1), margin 300ms cubic-bezier(0.4,0,0.2,1)",
  };
}

export function HomeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <path d="M24.95 7.84a1.5 1.5 0 0 0-1.9 0l-16.1 13.2a1.5 1.5 0 0 0 .95 2.66h2.33l1.2 13.03A2.5 2.5 0 0 0 13.9 39h7.59a1 1 0 0 0 1-1v-9.68a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V38a1 1 0 0 0 1 1h7.59a2.5 2.5 0 0 0 2.49-2.27l1.19-13.03h2.33a1.5 1.5 0 0 0 .95-2.66l-16.1-13.2Z"/>
    </svg>
  );
}

export function TikNavItem({ icon, label, active, collapsed, onClick }: { icon: React.ReactNode; label: string; active?: boolean; collapsed: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center rounded-2xl w-full py-2.5 my-0.5 transition-all duration-300 group relative overflow-hidden
        ${active 
          ? "text-brand bg-brand/5 font-black" 
          : "hover:bg-hover text-text-primary font-bold"}
      `}
      style={{ 
        paddingLeft: collapsed ? 0 : 12, 
        paddingRight: collapsed ? 0 : 12, 
        justifyContent: collapsed ? "center" : "flex-start" 
      }}
    >
      {/* Active Indicator Bar */}
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full" />
      )}

      <span className={`flex items-center justify-center w-8 h-8 flex-shrink-0 transition-all duration-300 ${active ? "scale-110" : "group-hover:scale-110 group-active:scale-95"}`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, { strokeWidth: active ? 3 : 2.5 }) : icon}
      </span>
      <span 
        className="text-[17px] text-start tracking-tight whitespace-nowrap ml-3" 
        style={labelStyle(collapsed, 160, 0)}
      >
        {label}
      </span>
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-text-primary text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none z-[100] whitespace-nowrap shadow-xl">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-text-primary" />
        </div>
      )}
    </button>
  );
}

export function BottomNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 transition-colors ${active ? "text-brand" : "text-text-muted hover:text-text-primary"}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export function SearchRow({ icon, label, removable, onRemove }: { icon: React.ReactNode; label: string; removable?: boolean; onRemove?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-2 rounded-[8px] hover:bg-hover cursor-pointer group transition-colors">
      <div className="flex items-center gap-3 text-text-secondary group-hover:text-text-primary transition-colors min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-[14px] truncate">{label}</span>
      </div>
      {removable && (
        <X 
          className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" 
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      )}
    </div>
  );
}
