"use client";

import { useTranslations } from "next-intl";
import type { ModerationQueueItem, SoundItem } from "@/types/admin";
import { ModerationList } from "./ModerationList";
import { SoundList } from "./SoundList";

export function OverviewSection({
  moderationItems,
  soundItems,
  isModerationLoading,
  isSoundLoading,
  onReview,
}: {
  moderationItems: ModerationQueueItem[];
  soundItems: SoundItem[];
  isModerationLoading: boolean;
  isSoundLoading: boolean;
  onReview: (id: number) => void;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
      <div className="rounded-xl border border-elevated bg-background shadow-sm">
        <div className="border-b border-elevated px-5 py-4">
          <div>
            <h2 className="text-lg font-black">{t("ops.moderationQueueTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {t("ops.moderationQueueDesc")}
            </p>
          </div>
        </div>
        <div className="p-4">
          <ModerationList
            items={moderationItems.slice(0, 5)}
            isLoading={isModerationLoading}
            onReview={onReview}
            soft
          />
        </div>
      </div>

      <div className="rounded-xl border border-elevated bg-background shadow-sm">
        <div className="border-b border-elevated px-5 py-4">
          <div>
            <h2 className="text-lg font-black">{t("ops.newSoundsTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {t("ops.newSoundsDesc")}
            </p>
          </div>
        </div>
        <div className="p-4">
          <SoundList items={soundItems.slice(0, 4)} isLoading={isSoundLoading} />
        </div>
      </div>
    </section>
  );
}
