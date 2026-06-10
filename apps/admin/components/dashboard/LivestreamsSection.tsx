"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Radio,
  Search,
  Square,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Input, Select } from "@repo/ui";
import { endAdminLivestream } from "@/services/livestream-admin-api-service";
import type {
  AdminLivestream,
  AdminLivestreamStatus,
  PageResponse,
} from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "./dashboard-common";
import { livestreamStatusOptions } from "./dashboard-config";
import { formatDate, statusVariant } from "./dashboard-utils";

type LivestreamStatusFilter = AdminLivestreamStatus | "";

export function LivestreamsSection({
  items,
  keyword,
  status,
  pageInfo,
  onKeywordChange,
  onStatusChange,
  onPageChange,
  isLoading,
  isError,
}: {
  items: AdminLivestream[];
  keyword: string;
  status: LivestreamStatusFilter;
  pageInfo?: PageResponse<AdminLivestream>;
  onKeywordChange: (keyword: string) => void;
  onStatusChange: (status: LivestreamStatusFilter) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();
  const [pendingEnd, setPendingEnd] = useState<AdminLivestream | null>(null);
  const statusSelectOptions = livestreamStatusOptions.map((option) => ({
    value: option,
    label: option ? t(`livestreamStatus.${option}`) : t("livestreams.allStatuses"),
  }));

  const endMutation = useMutation({
    mutationFn: (livestreamId: number) => endAdminLivestream(livestreamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "livestreams"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
      setPendingEnd(null);
    },
  });

  return (
    <Panel
      title={t("livestreams.title")}
      description={t("livestreams.description")}
      action={
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[560px] md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("livestreams.searchPlaceholder")}
              className="h-10 rounded-lg py-2 pl-10 pr-4"
            />
          </div>
          <Select
            value={status}
            options={statusSelectOptions}
            onChange={(nextStatus) => onStatusChange(nextStatus as LivestreamStatusFilter)}
            ariaLabel={t("livestreams.allStatuses")}
            className="md:w-52"
          />
        </div>
      }
    >
      {isError ? (
        <EmptyState
          icon={Radio}
          title={t("livestreams.loadErrorTitle")}
          detail={t("livestreams.loadErrorDesc")}
        />
      ) : isLoading ? (
        <LoadingRows count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Radio}
          title={t("livestreams.emptyTitle")}
          detail={t("livestreams.emptyDesc")}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-elevated">
            <div className="grid grid-cols-[minmax(320px,1.4fr)_140px_140px_150px_120px] gap-4 border-b border-elevated bg-surface px-4 py-3 text-xs font-black uppercase text-text-muted">
              <span>{t("livestreams.tableStream")}</span>
              <span>{t("livestreams.tableStatus")}</span>
              <span>{t("livestreams.tableAudience")}</span>
              <span>{t("livestreams.tableStarted")}</span>
              <span className="text-right">{t("livestreams.tableActions")}</span>
            </div>
            {items.map((livestream) => (
              <div
                key={livestream.id}
                className="grid grid-cols-[minmax(320px,1.4fr)_140px_140px_150px_120px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0"
              >
                <LivestreamIdentity livestream={livestream} />
                <div className="space-y-2">
                  <Badge variant={statusVariant(livestream.status)} size="sm">
                    {t(`livestreamStatus.${livestream.status}`)}
                  </Badge>
                  <p className="text-[11px] font-bold text-text-muted">
                    {t(`livestreamVisibility.${livestream.visibility}`)}
                  </p>
                </div>
                <div className="text-sm font-bold text-text-primary">
                  <p>{t("livestreams.currentViewers", { count: livestream.viewerCount })}</p>
                  <p className="text-xs text-text-muted">
                    {t("livestreams.peakViewers", { count: livestream.peakViewerCount })}
                  </p>
                </div>
                <p className="text-xs font-semibold text-text-muted">
                  {formatDate(livestream.startedAt ?? livestream.createdAt)}
                </p>
                <div className="flex justify-end gap-2">
                  {livestream.status === "LIVE" ? (
                    <IconActionButton
                      label={t("livestreams.end")}
                      icon={Square}
                      variant="danger"
                      onClick={() => {
                        endMutation.reset();
                        setPendingEnd(livestream);
                      }}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
            <span>
              {t("livestreams.pageSummary", {
                page: (pageInfo?.number ?? 0) + 1,
                total: Math.max(pageInfo?.totalPages ?? 1, 1),
                count: pageInfo?.totalElements ?? items.length,
              })}
            </span>
            <div className="flex gap-2">
              <IconActionButton
                label={t("livestreams.previous")}
                icon={ChevronLeft}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number <= 0}
                onClick={() => onPageChange(Math.max((pageInfo?.number ?? 0) - 1, 0))}
              />
              <IconActionButton
                label={t("livestreams.next")}
                icon={ChevronRight}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number + 1 >= pageInfo.totalPages}
                onClick={() => onPageChange((pageInfo?.number ?? 0) + 1)}
              />
            </div>
          </div>
        </>
      )}

      {pendingEnd ? (
        <EndLivestreamDialog
          livestream={pendingEnd}
          isPending={endMutation.isPending}
          errorMessage={endMutation.isError ? getErrorMessage(endMutation.error) : null}
          onCancel={() => {
            endMutation.reset();
            setPendingEnd(null);
          }}
          onConfirm={() => endMutation.mutate(pendingEnd.id)}
        />
      ) : null}
    </Panel>
  );
}

function LivestreamIdentity({ livestream }: { livestream: AdminLivestream }) {
  const t = useTranslations("Admin.dashboard");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
        {livestream.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={livestream.thumbnailUrl}
            alt={livestream.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Radio className="h-5 w-5 text-text-muted" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black">
          {livestream.title || t("livestreams.streamFallback", { id: livestream.id })}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-text-muted">
          @{livestream.host?.username ?? t("common.unknown")} ·{" "}
          {livestream.categoryName ?? t("livestreams.noCategory")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={livestream.allowChat ? "success" : "warning"} size="sm">
            {t(livestream.allowChat ? "livestreams.chatOn" : "livestreams.chatOff")}
          </Badge>
          <Badge variant={livestream.allowGifts ? "brand" : "warning"} size="sm">
            {t(livestream.allowGifts ? "livestreams.giftsOn" : "livestreams.giftsOff")}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function EndLivestreamDialog({
  livestream,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  livestream: AdminLivestream;
  isPending: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-elevated bg-background p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 text-red-600">
            <Square className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary">
              {t("livestreams.confirmEndTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {t("livestreams.confirmEndDesc", {
                title: livestream.title || t("livestreams.streamFallback", { id: livestream.id }),
              })}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold leading-6 text-red-200">
            <p>{t("livestreams.endErrorTitle")}</p>
            <p className="mt-1 text-xs font-medium text-red-100/80">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-elevated bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-text-muted">
              <Users className="h-4 w-4" />
              {t("livestreams.current")}
            </div>
            <p className="mt-2 text-xl font-black">{livestream.viewerCount}</p>
          </div>
          <div className="rounded-lg border border-elevated bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-text-muted">
              <CalendarClock className="h-4 w-4" />
              {t("livestreams.started")}
            </div>
            <p className="mt-2 text-sm font-bold">{formatDate(livestream.startedAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <IconActionButton
            label={t("livestreams.cancel")}
            icon={XCircle}
            variant="secondary"
            onClick={onCancel}
          />
          <IconActionButton
            label={t("livestreams.end")}
            icon={Square}
            variant="danger"
            isLoading={isPending}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
