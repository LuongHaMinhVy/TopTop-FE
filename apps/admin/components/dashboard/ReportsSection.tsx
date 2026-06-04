"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Flag,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Select } from "@/components/ui";
import { reviewAdminReport } from "@/services/report-admin-api-service";
import type {
  AdminReport,
  PageResponse,
  ReportResolutionAction,
  ReviewReportRequest,
} from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "./dashboard-common";
import { reportStatusOptions } from "./dashboard-config";
import { formatDate, statusVariant } from "./dashboard-utils";

export function ReportsSection({
  items,
  status,
  pageInfo,
  onStatusChange,
  onPageChange,
  isLoading,
  isError,
}: {
  items: AdminReport[];
  status: string;
  pageInfo?: PageResponse<AdminReport>;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const reviewMutation = useMutation({
    mutationFn: ({
      reportId,
      request,
    }: {
      reportId: number;
      request: ReviewReportRequest;
    }) => reviewAdminReport(reportId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
      setSelectedReport(null);
    },
  });
  const statusSelectOptions = reportStatusOptions.map((option) => ({
    value: option,
    label: option ? t(`reportStatus.${option}`) : t("reportsSection.allStatuses"),
  }));

  return (
    <Panel
      title={t("reportsSection.title")}
      description={t("reportsSection.description")}
      action={
        <Select
          value={status}
          options={statusSelectOptions}
          onChange={onStatusChange}
          ariaLabel={t("reportsSection.title")}
        />
      }
    >
      {isError ? (
        <EmptyState
          icon={Flag}
          title={t("reportsSection.loadErrorTitle")}
          detail={t("reportsSection.loadErrorDesc")}
        />
      ) : isLoading ? (
        <LoadingRows count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={t("reportsSection.emptyTitle")}
          detail={t("reportsSection.emptyDesc")}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-elevated">
            {items.map((report) => (
              <div
                key={report.id}
                className="grid grid-cols-1 gap-3 border-b border-elevated bg-background p-4 last:border-b-0 md:grid-cols-[1fr_200px]"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(report.status)}>
                      {t(`reportStatus.${report.status}`)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {t(`reportTargetType.${report.targetType}`)}
                    </Badge>
                    {report.reasonCode && (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text-muted">
                        {report.reasonCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black">
                    {report.reasonLabel ||
                      report.reasonCode ||
                      t("reportsSection.reportFallback", { id: report.id })}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    @{report.reporterUsername || t("common.unknown")} ·{" "}
                    {t("reportsSection.targetId", { id: report.targetId })} ·{" "}
                    {formatDate(report.createdAt)}
                  </p>
                  {report.additionalNote && (
                    <p className="mt-2 rounded-lg bg-surface p-2 text-xs text-text-muted italic">
                      &quot;{report.additionalNote}&quot;
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  {report.status === "PENDING" || report.status === "REVIEWING" ? (
                    <IconActionButton
                      label={t("reportsSection.review")}
                      icon={ClipboardCheck}
                      variant="secondary"
                      onClick={() => setSelectedReport(report)}
                    />
                  ) : (
                    <div className="min-w-0 text-right">
                      <Badge variant={statusVariant(report.status)}>
                        {t(`reportStatus.${report.status}`)}
                      </Badge>
                      {report.reviewedAt ? (
                        <p className="mt-2 text-xs font-semibold text-text-muted">
                          {formatDate(report.reviewedAt)}
                        </p>
                      ) : null}
                      {report.resolutionAction && report.resolutionAction !== "NONE" ? (
                        <p className="mt-1 text-xs font-bold text-text-primary">
                          {t(`reportResolutionAction.${report.resolutionAction}`)}
                        </p>
                      ) : null}
                      {report.reviewNote ? (
                        <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                          {report.reviewNote}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
            <span>
              {t("reportsSection.pageSummary", {
                page: (pageInfo?.number ?? 0) + 1,
                total: Math.max(pageInfo?.totalPages ?? 1, 1),
                count: pageInfo?.totalElements ?? items.length,
              })}
            </span>
            <div className="flex gap-2">
              <IconActionButton
                label={t("reportsSection.previous")}
                icon={ChevronLeft}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number <= 0}
                onClick={() => onPageChange(Math.max((pageInfo?.number ?? 0) - 1, 0))}
              />
              <IconActionButton
                label={t("reportsSection.next")}
                icon={ChevronRight}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number + 1 >= pageInfo.totalPages}
                onClick={() => onPageChange((pageInfo?.number ?? 0) + 1)}
              />
            </div>
          </div>
        </>
      )}

      {selectedReport ? (
        <ReportReviewDialog
          report={selectedReport}
          isPending={reviewMutation.isPending}
          onCancel={() => setSelectedReport(null)}
          onSubmit={(request) =>
            reviewMutation.mutate({
              reportId: selectedReport.id,
              request,
            })
          }
        />
      ) : null}
    </Panel>
  );
}

function ReportReviewDialog({
  report,
  isPending,
  onCancel,
  onSubmit,
}: {
  report: AdminReport;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (request: ReviewReportRequest) => void;
}) {
  const t = useTranslations("Admin.dashboard");
  const [decision, setDecision] = useState<ReviewReportRequest["status"]>(
    report.status === "PENDING" ? "REVIEWING" : report.status,
  );
  const [action, setAction] = useState<ReportResolutionAction>(
    report.resolutionAction && report.resolutionAction !== "NONE"
      ? report.resolutionAction
      : defaultActionForTarget(report),
  );
  const [note, setNote] = useState(report.reviewNote ?? "");

  const decisionOptions = ["REVIEWING", "RESOLVED", "REJECTED"].map((status) => ({
    value: status,
    label: t(`reportStatus.${status}`),
  }));
  const actionOptions = getActionOptions(report).map((value) => ({
    value,
    label: t(`reportResolutionAction.${value}`),
  }));
  const requiresAction = decision === "RESOLVED";
  const hasSupportedAction = actionOptions.length > 0;
  const canSubmit = !requiresAction || (hasSupportedAction && action !== "NONE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-elevated bg-background p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-surface p-2 text-brand">
            <Flag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-text-primary">
              {t("reportsSection.reviewTitle", { id: report.id })}
            </h3>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {report.reasonLabel ||
                report.reasonCode ||
                t("reportsSection.reportFallback", { id: report.id })}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ReportDetailItem
            label={t("reportsSection.reporter")}
            value={`@${report.reporterUsername || t("common.unknown")}`}
          />
          <ReportDetailItem
            label={t("reportsSection.target")}
            value={`${t(`reportTargetType.${report.targetType}`)} #${report.targetId}`}
          />
          <ReportDetailItem
            label={t("reportsSection.created")}
            value={formatDate(report.createdAt)}
          />
        </div>

        {report.additionalNote ? (
          <div className="mt-4 rounded-lg border border-elevated bg-surface p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-text-muted">
              <MessageSquareText className="h-4 w-4" />
              {t("reportsSection.userNote")}
            </div>
            <p className="text-sm leading-6 text-text-primary">{report.additionalNote}</p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <div>
            <p className="mb-2 text-xs font-black uppercase text-text-muted">
              {t("reportsSection.decision")}
            </p>
            <Select
              value={decision}
              options={decisionOptions}
              onChange={(value) => {
                const nextDecision = value as ReviewReportRequest["status"];
                setDecision(nextDecision);
                if (nextDecision === "RESOLVED" && action === "NONE") {
                  setAction(defaultActionForTarget(report));
                }
                if (nextDecision !== "RESOLVED") {
                  setAction("NONE");
                }
              }}
              ariaLabel={t("reportsSection.decision")}
              className="w-full"
            />
            <p className="mb-2 mt-4 text-xs font-black uppercase text-text-muted">
              {t("reportsSection.action")}
            </p>
            {hasSupportedAction ? (
              <Select
                value={action}
                options={actionOptions}
                onChange={(value) => setAction(value as ReportResolutionAction)}
                ariaLabel={t("reportsSection.action")}
                className="w-full"
                disabled={!requiresAction}
              />
            ) : (
              <p className="rounded-lg border border-elevated bg-surface p-3 text-xs font-semibold text-text-muted">
                {t("reportsSection.unsupportedAction")}
              </p>
            )}
            <p className="mt-1 text-xs font-semibold text-text-muted">
              {requiresAction
                ? t("reportsSection.actionHelper")
                : t("reportsSection.actionOnlyResolved")}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase text-text-muted">
              {t("reportsSection.reviewNote")}
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              placeholder={t("reportsSection.reviewNotePlaceholder")}
              className="min-h-28 w-full rounded-lg border border-elevated bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-brand"
            />
            <p className="mt-1 text-xs font-semibold text-text-muted">
              {t("reportsSection.reviewNoteHelper")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <IconActionButton
            label={t("reportsSection.cancel")}
            icon={XCircle}
            variant="secondary"
            onClick={onCancel}
          />
          <IconActionButton
            label={t("reportsSection.saveReview")}
            icon={decision === "REJECTED" ? XCircle : CheckCircle2}
            variant={decision === "REJECTED" ? "danger" : "primary"}
            isLoading={isPending}
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                status: decision,
                action: decision === "RESOLVED" ? action : "NONE",
                note: note.trim() || undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function getActionOptions(report: AdminReport): ReportResolutionAction[] {
  if (report.targetType === "VIDEO" || report.targetType === "VIDEO_POST") {
    return ["MARK_VIDEO_NEED_REVIEW", "REMOVE_VIDEO"];
  }
  if (report.targetType === "COMMENT") {
    return ["DELETE_COMMENT"];
  }
  if (report.targetType === "USER") {
    return ["SUSPEND_USER", "BAN_USER"];
  }
  return [];
}

function defaultActionForTarget(report: AdminReport): ReportResolutionAction {
  return getActionOptions(report)[0] ?? "NONE";
}

function ReportDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-elevated bg-surface p-3">
      <p className="text-[11px] font-black uppercase text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}
