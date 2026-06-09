"use client";

import { ChevronLeft, ChevronRight, Music2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import type { SoundItem } from "@/types/admin";
import type { Meta } from "@/utils/common";
import { EmptyState, IconActionButton, Panel } from "./dashboard-common";
import { SoundList } from "./SoundList";

export function SoundsSection({
  items,
  keyword,
  pageInfo,
  onKeywordChange,
  onPageChange,
  isLoading,
  isError,
  onAddClick,
  onEdit,
  onDelete,
}: {
  items: SoundItem[];
  keyword: string;
  pageInfo?: Meta;
  onKeywordChange: (keyword: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  onAddClick?: () => void;
  onEdit?: (sound: SoundItem) => void;
  onDelete?: (sound: SoundItem) => void;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <Panel
      title={t("ops.soundManagementTitle")}
      description={t("ops.soundManagementDesc")}
      action={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full max-w-md">
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder={t("ops.soundSearchPlaceholder")}
            className="h-10 rounded-lg px-4 py-2"
          />
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">{t("sounds.addNew")}</span>
            </button>
          )}
        </div>
      }
    >
      {isError ? (
        <EmptyState
          icon={Music2}
          title={t("ops.soundsLoadErrorTitle")}
          detail={t("ops.soundsLoadErrorDesc")}
        />
      ) : (
        <>
          <SoundList
            items={items}
            isLoading={isLoading}
            expanded
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {!isLoading && items.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
              <span>
                {t("sounds.pageSummary", {
                  page: (pageInfo?.page ?? 0) + 1,
                  total: Math.max(pageInfo?.totalPages ?? 1, 1),
                  count: pageInfo?.totalElements ?? items.length,
                })}
              </span>
              <div className="flex gap-2">
                <IconActionButton
                  label={t("sounds.previous")}
                  icon={ChevronLeft}
                  variant="secondary"
                  disabled={!pageInfo || pageInfo.page <= 0}
                  onClick={() => onPageChange(Math.max((pageInfo?.page ?? 0) - 1, 0))}
                />
                <IconActionButton
                  label={t("sounds.next")}
                  icon={ChevronRight}
                  variant="secondary"
                  disabled={!pageInfo || pageInfo.page + 1 >= pageInfo.totalPages}
                  onClick={() => onPageChange((pageInfo?.page ?? 0) + 1)}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}
