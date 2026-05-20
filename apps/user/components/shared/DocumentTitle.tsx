"use client";

import { useEffect } from "react";

const DEFAULT_TITLE = "TopTop - Make Your Day";

export function DocumentTitle({ title }: { title?: string | null }) {
  useEffect(() => {
    document.title = title?.trim() || DEFAULT_TITLE;
  }, [title]);

  return null;
}

export function truncateTitle(value: string, maxLength = 70) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}
