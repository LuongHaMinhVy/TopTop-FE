"use client";

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export const Modal = ({ isOpen, onClose, children, title, className = "" }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div 
        className={`
          relative w-full max-w-[480px] bg-background
          rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
          animate-in zoom-in slide-in-from-bottom-4 duration-300
          ${className}
        `}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-2 p-2 rounded-full text-text-muted hover:bg-hover hover:text-text-primary transition-colors z-10"
        >
          <X size={24} />
        </button>

        {title && (
          <div className="px-8 pt-8 pb-4 border-b border-elevated text-center">
            <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          </div>
        )}

        <div className="flex-1 px-8 py-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
