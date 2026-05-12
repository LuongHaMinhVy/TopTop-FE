"use client";

import React, { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", containerClassName = "", id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={`
              w-full px-6 py-4 bg-surface 
              border border-elevated 
              rounded-2xl outline-none transition-all duration-200
              focus:ring-2 focus:ring-brand focus:border-brand
              text-text-primary
              placeholder:text-text-muted
              disabled:opacity-50 disabled:bg-surface
              ${error ? "border-red-500 focus:ring-red-500" : ""}
              ${isPassword ? "pr-14" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-red-500 ml-1 mt-0.5 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-text-muted ml-1 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
