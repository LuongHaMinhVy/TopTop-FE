"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  useState,
} from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      containerClassName = "",
      id,
      type,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`flex w-full flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="ml-1 text-xs font-bold uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={`w-full rounded-2xl border border-elevated bg-surface px-6 py-4 text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand disabled:bg-surface disabled:opacity-50 placeholder:text-text-muted ${error ? "border-red-500 focus:ring-red-500" : ""} ${isPassword ? "pr-14" : ""} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-muted transition hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && (
          <p className="ml-1 mt-0.5 text-xs font-medium text-red-500">{error}</p>
        )}
        {!error && helperText && (
          <p className="ml-1 mt-0.5 text-xs text-text-muted">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
