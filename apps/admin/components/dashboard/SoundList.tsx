"use client";

import { Music2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SoundItem } from "@/types/admin";
import { EmptyState, LoadingRows } from "./dashboard-common";
import { Button, Badge } from "@repo/ui";

export function SoundList({
  items,
  isLoading,
  expanded = false,
  onEdit,
  onDelete,
}: {
  items: SoundItem[];
  isLoading: boolean;
  expanded?: boolean;
  onEdit?: (sound: SoundItem) => void;
  onDelete?: (sound: SoundItem) => void;
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
          className="toptop-card-glow flex items-center gap-3 rounded-xl border border-elevated bg-surface/70 p-3 hover:bg-surface transition-all duration-300"
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
            <p className="truncate text-sm font-black text-text-primary">
              {sound.title || t("sounds.soundFallback", { id: sound.id })}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {sound.artistName ||
                sound.owner?.displayName ||
                sound.owner?.username ||
                t("common.unknown")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="brand" size="sm">
                {sound.type || t("sounds.defaultType")}
              </Badge>
              {sound.isPublic === false ? (
                <Badge variant="warning" size="sm">
                  {t("sounds.statusPrivate")}
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  {t("sounds.statusPublic")}
                </Badge>
              )}
              {sound.isActive === false && (
                <Badge variant="error" size="sm">
                  {t("sounds.statusInactive")}
                </Badge>
              )}
              <span className="text-xs font-bold text-text-muted ml-auto">
                {t("sounds.usageCount", {
                  count: sound.stats?.usageCount ?? 0,
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0 border-l border-elevated pl-2 ml-1">
            {onEdit && (
              <Button
                type="button"
                onClick={() => onEdit(sound)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-brand transition"
                title={t("sounds.edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                onClick={() => onDelete(sound)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-red-500 transition"
                title={t("sounds.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
