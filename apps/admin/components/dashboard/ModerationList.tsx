"use client";

import { Eye, ShieldCheck, ShieldAlert, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import type { ModerationQueueItem } from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows } from "./dashboard-common";
import { formatDate, statusVariant } from "./dashboard-utils";

export function ModerationList({
  items,
  isLoading,
  expanded = false,
  soft = false,
  onReview,
}: {
  items: ModerationQueueItem[];
  isLoading: boolean;
  expanded?: boolean;
  soft?: boolean;
  onReview?: (videoId: number) => void;
}) {
  const t = useTranslations("Admin.dashboard");

  if (isLoading) {
    return <LoadingRows count={expanded ? 6 : 4} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("ops.emptyModerationTitle")}
        detail={t("ops.emptyModerationDesc")}
      />
    );
  }

  return (
    <div className={soft ? "space-y-3" : "overflow-hidden rounded-lg border border-elevated"}>
      {items.map((item) => (
        <div
          key={item.videoId}
          className={
            soft
              ? "grid grid-cols-[72px_1fr] gap-4 rounded-xl border border-elevated bg-surface/70 p-3 md:grid-cols-[84px_1fr_104px]"
              : "grid grid-cols-[72px_1fr] gap-4 border-b border-elevated bg-background p-4 last:border-b-0 md:grid-cols-[84px_1fr_180px]"
          }
        >
          <div className="relative h-24 overflow-hidden rounded-xl bg-black">
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt={item.caption ?? `Video ${item.videoId}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Video className="h-6 w-6 text-white/50" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(item.moderationStatus)}>
                {t(`moderationStatus.${item.moderationStatus}`)}
              </Badge>
              {(item.reportCount ?? 0) > 0 && (
                <Badge variant="error">
                  {t("moderation.reportCount", { count: item.reportCount ?? 0 })}
                </Badge>
              )}
              {typeof item.riskScore === "number" && (
                <Badge variant={item.riskScore >= 0.7 ? "error" : "warning"}>
                  {t("moderation.risk", {
                    percent: (item.riskScore * 100).toFixed(0),
                  })}
                </Badge>
              )}
            </div>
            <p className="truncate text-sm font-black">
              {item.caption || t("moderation.videoFallback", { id: item.videoId })}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              @{item.authorUsername || t("common.unknown")} ·{" "}
              {formatDate(item.createdAt)}
            </p>
            {expanded && item.categories && item.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text-muted"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="hidden items-center justify-end gap-2 md:flex">
            <IconActionButton
              label={t("ops.detail")}
              icon={Eye}
              variant="secondary"
              onClick={() => onReview?.(item.videoId)}
            />
            <IconActionButton
              label={t("ops.review")}
              icon={ShieldCheck}
              onClick={() => onReview?.(item.videoId)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
