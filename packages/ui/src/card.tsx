import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
}

export const Card = ({ children, className = "", title, description, footer }: CardProps) => {
  return (
    <div
      className={`
        bg-background border border-elevated 
        rounded-3xl shadow-xl overflow-hidden
        ${className}
      `}
    >
      {(title || description) && (
        <div className="px-8 py-6 border-b border-elevated flex justify-between items-center">
          <div>
            {title && <h3 className="text-xl font-bold text-text-primary">{title}</h3>}
            {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
          </div>
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
      {footer && (
        <div className="px-8 py-4 bg-surface border-t border-elevated">
          {footer}
        </div>
      )}
    </div>
  );
};
