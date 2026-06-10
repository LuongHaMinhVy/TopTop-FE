"use client";

import React from "react";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, className = "", ...props }: FormProps) {
  return (
    <form className={className} {...props}>
      {children}
    </form>
  );
}
