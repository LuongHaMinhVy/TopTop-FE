"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModerationAuditLogs } from "@/services/moderation-api-service";
import type { ModerationAuditLog } from "@/types/admin";
import { useTranslations } from "next-intl";
import { Button, Input, Select, Badge } from "@repo/ui";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { EmptyState, LoadingRows, Panel, IconActionButton } from "@/components/dashboard/dashboard-common";

export default function AuditLogsPage() {
  const t = useTranslations("Admin.dashboard");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [actorTypeFilter, setActorTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<ModerationAuditLog | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "audit-logs", page, pageSize],
    queryFn: () => getModerationAuditLogs({ page, size: pageSize }),
  });

  const auditLogs = data?.data?.content ?? [];
  const pageInfo = data?.data;

  // Client-side filtering on top of paginated results for fast navigation
  const filteredLogs = auditLogs.filter((log: ModerationAuditLog) => {
    if (searchQuery.trim()) {
      const targetIdStr = String(log.targetId || "");
      if (!targetIdStr.includes(searchQuery.trim())) {
        return false;
      }
    }
    if (targetTypeFilter !== "ALL" && log.targetType !== targetTypeFilter) {
      return false;
    }
    if (actionFilter !== "ALL" && log.action !== actionFilter) {
      return false;
    }
    if (actorTypeFilter !== "ALL" && log.actorType !== actorTypeFilter) {
      return false;
    }
    return true;
  });

  const getActionBadgeVariant = (action: string): "success" | "error" | "warning" | "info" => {
    switch (action) {
      case "AUTO_APPROVE":
      case "MANUAL_APPROVE":
        return "success";
      case "AUTO_REJECT":
      case "MANUAL_REJECT":
        return "error";
      case "MARK_NEED_REVIEW":
        return "warning";
      default:
        return "info";
    }
  };

  const getActorBadgeVariant = (actorType: string): "info" | "brand" => {
    switch (actorType) {
      case "SYSTEM":
        return "info";
      case "ADMIN":
        return "brand";
      default:
        return "info";
    }
  };

  const getTargetBadgeVariant = (targetType: string): "info" | "brand" | "warning" | "success" => {
    switch (targetType) {
      case "VIDEO":
        return "info";
      case "VIDEO_MUSIC":
        return "brand";
      case "SHOP":
        return "warning";
      case "PRODUCT":
        return "success";
      default:
        return "info";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">{t("pages.auditLogs.title")}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {t("pages.auditLogs.description")}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="flex items-center gap-2"
        >
          {isLoading || isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Panel
        title="Audit Action History"
        description="Filter and review system-wide administrative changes."
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5 items-end">
          <div>
            <Input
              placeholder="Search Target ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!h-10 !py-2 !px-4 !rounded-lg !text-sm"
            />
          </div>

          <div>
            <Select
              value={targetTypeFilter}
              onChange={setTargetTypeFilter}
              options={[
                { value: "ALL", label: "All Target Types" },
                { value: "VIDEO", label: "Video" },
                { value: "VIDEO_MUSIC", label: "Video Music" },
                { value: "SHOP", label: "Shop" },
                { value: "PRODUCT", label: "Product" },
              ]}
              ariaLabel="Filter by Target Type"
              className="w-full"
            />
          </div>

          <div>
            <Select
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { value: "ALL", label: "All Actions" },
                { value: "AUTO_APPROVE", label: "Auto Approve" },
                { value: "AUTO_REJECT", label: "Auto Reject" },
                { value: "MANUAL_APPROVE", label: "Manual Approve" },
                { value: "MANUAL_REJECT", label: "Manual Reject" },
                { value: "MARK_NEED_REVIEW", label: "Mark Need Review" },
              ]}
              ariaLabel="Filter by Action"
              className="w-full"
            />
          </div>

          <div>
            <Select
              value={actorTypeFilter}
              onChange={setActorTypeFilter}
              options={[
                { value: "ALL", label: "All Actors" },
                { value: "SYSTEM", label: "System" },
                { value: "ADMIN", label: "Admin" },
              ]}
              ariaLabel="Filter by Actor"
              className="w-full"
            />
          </div>

          <div>
            <Select
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(0);
              }}
              options={[
                { value: "10", label: "10 per page" },
                { value: "20", label: "20 per page" },
                { value: "50", label: "50 per page" },
              ]}
              ariaLabel="Page Size"
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingRows count={5} />
        ) : isError ? (
          <EmptyState
            icon={ClipboardList}
            title="Failed to load audit logs"
            detail="There was an error communicating with the administration API. Please check your network and authorization."
          />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No logs found"
            detail={
              searchQuery ||
              targetTypeFilter !== "ALL" ||
              actionFilter !== "ALL" ||
              actorTypeFilter !== "ALL"
                ? "Try adjusting your search filters."
                : "No administration audit logs have been recorded yet."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-elevated bg-background">
              <table className="min-w-full divide-y divide-elevated text-left text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Target Type</th>
                    <th className="px-6 py-4">Target ID</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Status Change</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-elevated bg-background">
                  {filteredLogs.map((log: ModerationAuditLog) => (
                    <tr key={log.id} className="hover:bg-surface/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                        {log.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={getTargetBadgeVariant(log.targetType)} size="sm">
                          {log.targetType}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold">
                        #{log.targetId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant={getActorBadgeVariant(log.actorType)} size="sm" className="w-fit">
                            {log.actorType}
                          </Badge>
                          {log.actorUserId && (
                            <span className="text-xs font-mono text-text-muted">
                              ID: {log.actorUserId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {log.previousStatus || log.newStatus ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="rounded bg-surface px-1.5 py-0.5 text-text-muted">
                              {log.previousStatus || "NULL"}
                            </span>
                            <span className="text-text-muted">&rarr;</span>
                            <span className="rounded bg-surface px-1.5 py-0.5 font-medium">
                              {log.newStatus || "NULL"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">-</span>
                        )}
                      </td>
                      <td className="max-w-[180px] truncate px-6 py-4 text-xs">
                        <div className="flex flex-col">
                          {log.reasonCode && (
                            <span className="font-bold uppercase text-text-secondary">
                              {log.reasonCode}
                            </span>
                          )}
                          <span className="truncate text-text-muted">
                            {log.reasonMessage || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-text-muted">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="flex items-center gap-1 text-xs text-brand hover:underline font-bold"
                        >
                          <Info className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
              <span>
                Showing {filteredLogs.length} of{" "}
                {pageInfo?.totalElements ?? filteredLogs.length} entries
              </span>
              <div className="flex gap-2">
                <IconActionButton
                  label="Previous"
                  icon={ChevronLeft}
                  variant="secondary"
                  disabled={!pageInfo || pageInfo.number <= 0}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                />
                <span className="flex items-center px-2 text-xs font-bold text-text-primary">
                  Page {(pageInfo?.number ?? 0) + 1} of{" "}
                  {pageInfo?.totalPages ?? 1}
                </span>
                <IconActionButton
                  label="Next"
                  icon={ChevronRight}
                  variant="secondary"
                  disabled={
                    !pageInfo || pageInfo.number + 1 >= pageInfo.totalPages
                  }
                  onClick={() => setPage((prev) => prev + 1)}
                />
              </div>
            </div>
          </>
        )}
      </Panel>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-elevated bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-elevated p-5">
              <h3 className="text-base font-black">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-1 text-text-muted hover:bg-surface hover:text-text-primary transition"
              >
                &times; Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Log ID</p>
                  <p className="font-mono mt-0.5">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Timestamp</p>
                  <p className="mt-0.5">
                    {selectedLog.createdAt
                      ? new Date(selectedLog.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Target Entity</p>
                  <p className="mt-0.5 font-bold">
                    {selectedLog.targetType} #{selectedLog.targetId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Action Performed</p>
                  <p className="mt-0.5">
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} size="sm">
                      {selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Actor / Initiator</p>
                  <p className="mt-0.5">
                    <Badge variant={getActorBadgeVariant(selectedLog.actorType)} size="sm">
                      {selectedLog.actorType}
                    </Badge>
                    {selectedLog.actorUserId && (
                      <span className="ml-1.5 font-mono text-xs text-text-muted">
                        (User ID: {selectedLog.actorUserId})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Status Transition</p>
                  <p className="mt-0.5 font-mono text-xs">
                    {selectedLog.previousStatus || "NULL"} &rarr;{" "}
                    {selectedLog.newStatus || "NULL"}
                  </p>
                </div>
              </div>

              <hr className="border-elevated" />

              <div className="text-sm">
                <p className="text-xs text-text-muted">Reason Code</p>
                <p className="mt-0.5 font-bold uppercase">
                  {selectedLog.reasonCode || "N/A"}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-xs text-text-muted">Reason Message / Comment</p>
                <div className="mt-1 rounded-md bg-surface p-3 text-xs leading-5 whitespace-pre-wrap border border-elevated">
                  {selectedLog.reasonMessage || "No additional description provided."}
                </div>
              </div>

              {selectedLog.metadataJson && (
                <div className="text-sm">
                  <p className="text-xs text-text-muted">Metadata (JSON)</p>
                  <pre className="mt-1 max-h-[150px] overflow-auto rounded bg-surface p-3 font-mono text-[10px] text-text-secondary border border-elevated">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(selectedLog.metadataJson),
                          null,
                          2
                        );
                      } catch {
                        return selectedLog.metadataJson;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-elevated p-4 bg-surface/50">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
