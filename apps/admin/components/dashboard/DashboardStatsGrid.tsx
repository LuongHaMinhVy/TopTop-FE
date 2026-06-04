"use client";

import { useMemo } from "react";
import { FileWarning, ShieldAlert, Users, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getAdminDashboardStats } from "@/services/admin-dashboard-api-service";
import type { StatItem } from "./dashboard-common";

export function DashboardStatsGrid() {
  const t = useTranslations("Admin.dashboard");

  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => getAdminDashboardStats(),
  });

  const dashboardStats = statsQuery.data?.data;
  const stats = useMemo<StatItem[]>(
    () => [
      {
        label: t("stats.totalCreators"),
        value: dashboardStats ? String(dashboardStats.totalUsers) : "-",
        hint: t("stats.totalCreatorsHint"),
        icon: Users,
        tone: "bg-cyan/15 text-cyan",
      },
      {
        label: t("stats.totalVideos"),
        value: dashboardStats ? String(dashboardStats.totalVideos) : "-",
        hint: t("stats.totalVideosHint"),
        icon: Video,
        tone: "bg-brand/10 text-brand",
      },
      {
        label: t("stats.activityReports"),
        value: dashboardStats ? String(dashboardStats.totalReports) : "-",
        hint: t("stats.activityReportsHint"),
        icon: ShieldAlert,
        tone: "bg-amber-100 text-amber-700",
      },
      {
        label: t("stats.pendingModeration"),
        value: dashboardStats
          ? String(dashboardStats.pendingModerationVideos)
          : "-",
        hint: t("stats.pendingModerationHint"),
        icon: FileWarning,
        tone: "bg-blue-100 text-blue-700",
      },
    ],
    [dashboardStats, t],
  );

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <OverviewStatCard
          key={stat.label}
          stat={stat}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          index={index}
        />
      ))}
    </section>
  );
}

function OverviewStatCard({
  stat,
  isLoading,
  isError,
  index,
}: {
  stat: StatItem;
  isLoading: boolean;
  isError: boolean;
  index: number;
}) {
  const t = useTranslations("Admin.dashboard");
  const Icon = stat.icon;
  const accents = [
    "from-cyan/15 via-cyan/5",
    "from-brand/15 via-brand/5",
    "from-amber-400/15 via-amber-400/5",
    "from-indigo-400/15 via-indigo-400/5",
  ];

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-elevated bg-gradient-to-br ${accents[index] ?? accents[0]} to-background p-5 shadow-sm`}
    >
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-elevated bg-background/60 px-2.5 py-1 text-[11px] font-black uppercase text-text-muted">
          {t(isError ? "stats.unavailable" : "stats.liveData")}
        </span>
      </div>

      <div className="relative mt-5">
        <p className="text-sm font-bold text-text-muted">{stat.label}</p>
        {isLoading ? (
          <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-surface" />
        ) : (
          <p className="mt-1 text-3xl font-black tracking-normal text-text-primary">
            {stat.value}
          </p>
        )}
        <p className="mt-3 min-h-10 text-xs leading-5 text-text-muted">{stat.hint}</p>
      </div>
    </article>
  );
}
