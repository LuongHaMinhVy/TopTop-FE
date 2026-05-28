import {
  Flag,
  LayoutDashboard,
  Music2,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { ElementType } from "react";

export type SectionKey =
  | "overview"
  | "moderation"
  | "users"
  | "reports"
  | "sounds";

export type DashboardNavItem = {
  key: SectionKey;
  href: string;
  labelKey: string;
  titleKey: string;
  descriptionKey: string;
  icon: ElementType;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    key: "overview",
    href: "/overview",
    labelKey: "nav.overview",
    titleKey: "pages.overview.title",
    descriptionKey: "pages.overview.description",
    icon: LayoutDashboard,
  },
  {
    key: "moderation",
    href: "/moderation",
    labelKey: "ops.moderation",
    titleKey: "pages.moderation.title",
    descriptionKey: "pages.moderation.description",
    icon: ShieldAlert,
  },
  {
    key: "users",
    href: "/users",
    labelKey: "ops.users",
    titleKey: "pages.users.title",
    descriptionKey: "pages.users.description",
    icon: Users,
  },
  {
    key: "reports",
    href: "/reports",
    labelKey: "ops.reports",
    titleKey: "pages.reports.title",
    descriptionKey: "pages.reports.description",
    icon: Flag,
  },
  {
    key: "sounds",
    href: "/sounds",
    labelKey: "ops.sounds",
    titleKey: "pages.sounds.title",
    descriptionKey: "pages.sounds.description",
    icon: Music2,
  },
];

export const moderationStatusOptions = [
  "PENDING",
  "NEED_REVIEW",
  "APPROVED",
  "REJECTED",
];

export const reportStatusOptions = [
  "",
  "PENDING",
  "REVIEWING",
  "RESOLVED",
  "REJECTED",
] as const;
