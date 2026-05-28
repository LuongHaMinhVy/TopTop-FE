"use client";

import { Music2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import type { SoundItem } from "@/types/admin";
import { EmptyState, LoadingRows } from "./dashboard-common";

export function SoundList({
  items,
  isLoading,
  expanded = false,
}: {
  items: SoundItem[];
  isLoading: boolean;
  expanded?: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  if (isLoading) {
    return <LoadingRows count={expanded ? 6 : 4} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title={t("ops.emptySoundsTitle")}
        detail={t("ops.emptySoundsDesc")}
      />
    );
  }

  const gridClass = expanded
    ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
    : "grid grid-cols-1 gap-3";

  return (
    <div className={gridClass}>
      {items.map((sound) => (
        <div
          key={sound.id}
          className="flex items-center gap-3 rounded-xl border border-elevated bg-surface/70 p-3"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan/10 text-cyan">
            {sound.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sound.coverUrl}
                alt={sound.title ?? t("sounds.coverAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <Music2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">
              {sound.title || t("sounds.soundFallback", { id: sound.id })}
            </p>
            <p className="mt-1 truncate text-sm text-text-muted">
              {sound.artistName ||
                sound.owner?.displayName ||
                sound.owner?.username ||
                t("common.unknown")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <Badge variant="brand" size="sm">
                {sound.type || t("sounds.defaultType")}
              </Badge>
              <span className="text-xs font-bold text-text-muted">
                {t("sounds.usageCount", {
                  count: sound.stats?.usageCount ?? 0,
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
