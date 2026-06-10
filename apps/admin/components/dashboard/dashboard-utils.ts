import type { ComponentProps } from "react";
import type { Badge } from "@repo/ui";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export function statusVariant(status: string): BadgeVariant {
  if (status === "APPROVED" || status === "RESOLVED" || status === "ENDED") {
    return "success";
  }
  if (
    status === "REJECTED" ||
    status === "FAILED" ||
    status === "BANNED" ||
    status === "CANCELLED"
  ) {
    return "error";
  }
  if (
    status === "NEED_REVIEW" ||
    status === "REVIEWING" ||
    status === "SUSPENDED"
  ) {
    return "warning";
  }
  if (status === "PENDING" || status === "SCHEDULED") return "info";
  if (status === "ACTIVE") return "success";
  return "brand";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
