"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative min-w-44 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border px-3.5 text-left text-sm font-bold transition-colors ${
          isOpen
            ? "border-text-muted bg-surface text-text-primary"
            : "border-elevated bg-background text-text-primary hover:bg-hover"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="truncate">{selectedOption?.label ?? ""}</span>
        <ChevronDown
          size={16}
          className={`ml-3 shrink-0 text-text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          data-select-menu
          className="select-options-solid absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-elevated bg-background py-1 shadow-2xl"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value || "ALL"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex h-10 w-full items-center justify-between gap-3 px-3.5 text-left text-sm transition-colors ${
                  selected
                    ? "bg-brand/10 font-black text-brand"
                    : "font-semibold text-text-primary hover:bg-hover"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check size={15} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
