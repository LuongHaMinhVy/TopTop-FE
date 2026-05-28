"use client";

import { FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui";
import type { ModerationQueueItem } from "@/types/admin";
import { EmptyState, Panel } from "./dashboard-common";
import { moderationStatusOptions } from "./dashboard-config";
import { ModerationList } from "./ModerationList";

export function ModerationSection({
  items,
  status,
  onStatusChange,
  isLoading,
  isError,
  onReview,
}: {
  items: ModerationQueueItem[];
  status: string;
  onStatusChange: (status: string) => void;
  isLoading: boolean;
  isError: boolean;
  onReview: (id: number) => void;
}) {
  const t = useTranslations("Admin.dashboard");
  const statusSelectOptions = moderationStatusOptions.map((option) => ({
    value: option,
    label: option,
  }));

  return (
    <Panel
      title={t("ops.videoModerationTitle")}
      description={t("ops.videoModerationDesc")}
      action={
        <Select
          value={status}
          options={statusSelectOptions}
          onChange={onStatusChange}
          ariaLabel={t("ops.videoModerationTitle")}
        />
      }
    >
      {isError ? (
        <EmptyState
          icon={FileWarning}
          title={t("ops.moderationLoadErrorTitle")}
          detail={t("ops.moderationLoadErrorDesc")}
        />
      ) : (
        <ModerationList
          items={items}
          isLoading={isLoading}
          expanded
          onReview={onReview}
        />
      )}
    </Panel>
  );
}
