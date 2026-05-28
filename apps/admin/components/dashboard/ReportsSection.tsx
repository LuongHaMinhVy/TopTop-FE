"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Select } from "@/components/ui";
import { reviewAdminReport } from "@/services/report-admin-api-service";
import type { AdminReport, ReviewReportRequest } from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "./dashboard-common";
import { reportStatusOptions } from "./dashboard-config";
import { formatDate, statusVariant } from "./dashboard-utils";

export function ReportsSection({
  items,
  status,
  onStatusChange,
  isLoading,
  isError,
}: {
  items: AdminReport[];
  status: string;
  onStatusChange: (status: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();

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
    },
  });
  const statusSelectOptions = reportStatusOptions.map((option) => ({
    value: option,
    label: option || t("reportsSection.allStatuses"),
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
        <div className="overflow-hidden rounded-lg border border-elevated">
          {items.map((report) => (
            <div
              key={report.id}
              className="grid grid-cols-1 gap-3 border-b border-elevated bg-background p-4 last:border-b-0 md:grid-cols-[1fr_200px]"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                  <Badge variant="info" size="sm">
                    {report.targetType}
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
                  <>
                    <IconActionButton
                      label={t("reportsSection.resolve")}
                      icon={CheckCircle2}
                      variant="secondary"
                      isLoading={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          reportId: report.id,
                          request: { status: "RESOLVED" },
                        })
                      }
                    />
                    <IconActionButton
                      label={t("reportsSection.reject")}
                      icon={XCircle}
                      isLoading={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          reportId: report.id,
                          request: { status: "REJECTED" },
                        })
                      }
                    />
                  </>
                ) : (
                  <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
