"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModerationSection } from "@/components/dashboard/ModerationSection";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { getVideoModerationQueue, reviewVideoModeration } from "@/services/moderation-api-service";
import type { ModerationQueueItem } from "@/types/admin";
import { Button } from "@repo/ui";
import { Check, Loader2, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const emptyModerationItems: ModerationQueueItem[] = [];

export default function AdminModerationPage() {
  const t = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();
  const [moderationStatus, setModerationStatus] = useState("NEED_REVIEW");
  const [reviewVideoId, setReviewVideoId] = useState<number | null>(null);
  
  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [reasonMessage, setReasonMessage] = useState("");

  const moderationQuery = useQuery({
    queryKey: ["admin", "moderation", moderationStatus],
    queryFn: () =>
      getVideoModerationQueue({
        status: moderationStatus,
        page: 0,
        size: 20, // default size slightly larger to make batch actions useful
      }),
  });

  const moderationItems =
    moderationQuery.data?.data?.content ?? emptyModerationItems;

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({
      ids,
      decision,
      reasonCode,
      reasonMessage,
    }: {
      ids: number[];
      decision: "APPROVED" | "REJECTED";
      reasonCode?: string;
      reasonMessage?: string;
    }) => {
      // Process requests in parallel
      await Promise.all(
        ids.map((id) =>
          reviewVideoModeration(id, {
            decision: decision === "APPROVED" ? "APPROVE" : "REJECT",
            reasonCode: reasonCode || undefined,
            reasonMessage: reasonMessage || undefined,
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
      setSelectedIds([]);
      setIsBulkRejectModalOpen(false);
      setReasonCode("");
      setReasonMessage("");
    },
  });

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("moderation.bulkApproveConfirm", { count: selectedIds.length }))) {
      bulkMutation.mutate({
        ids: selectedIds,
        decision: "APPROVED",
      });
    }
  };

  const handleBulkRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    bulkMutation.mutate({
      ids: selectedIds,
      decision: "REJECTED",
      reasonCode,
      reasonMessage,
    });
  };

  // Reset selectedIds if items or status change
  const handleStatusChange = (newStatus: string) => {
    setModerationStatus(newStatus);
    setSelectedIds([]);
  };

  return (
    <>
      <ModerationSection
        items={moderationItems}
        status={moderationStatus}
        onStatusChange={handleStatusChange}
        isLoading={moderationQuery.isLoading}
        isError={moderationQuery.isError}
        onReview={setReviewVideoId}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
      />

      {reviewVideoId !== null && (
        <ReviewModal
          videoId={reviewVideoId}
          onClose={() => setReviewVideoId(null)}
        />
      )}

      {/* Floating Batch Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-elevated bg-background/95 px-6 py-3.5 shadow-2xl backdrop-blur-md transition-all md:w-auto w-[92%] max-w-lg">
          <span className="text-xs font-black text-text-primary whitespace-nowrap">
            {t("moderation.selectedCount", { count: selectedIds.length })}
          </span>
          <div className="h-4 w-px bg-elevated" />
          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-9 rounded-full px-3 text-xs font-bold text-text-muted hover:bg-hover transition active:scale-95"
            >
              {t("moderation.clearSelection")}
            </button>
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={bulkMutation.isPending}
              className="h-9 rounded-full bg-green-600 px-4 text-xs font-black text-white hover:bg-green-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              {bulkMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {t("moderation.bulkApprove")}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkRejectModalOpen(true)}
              disabled={bulkMutation.isPending}
              className="h-9 rounded-full border border-elevated px-4 text-xs font-black text-text-primary hover:bg-hover flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              {bulkMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {t("moderation.bulkReject")}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Reject Reason Dialog */}
      {isBulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-elevated bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-text-primary">
                {t("moderation.bulkRejectConfirm", { count: selectedIds.length })}
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkRejectModalOpen(false)}
                className="rounded-full p-1 text-text-muted hover:bg-hover hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBulkRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-text-muted mb-1.5">
                  {t("moderation.reasonCode")}
                </label>
                <input
                  type="text"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  placeholder="e.g. SPAM, NUDITY, VIOLENCE"
                  className="w-full rounded-xl border border-elevated bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-text-muted mb-1.5">
                  {t("moderation.reasonMessage")}
                </label>
                <textarea
                  value={reasonMessage}
                  onChange={(e) => setReasonMessage(e.target.value)}
                  placeholder="Details for the creator..."
                  rows={3}
                  className="w-full rounded-xl border border-elevated bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsBulkRejectModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-text-muted bg-transparent border border-elevated hover:bg-hover"
                >
                  {t("reviewModal.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={bulkMutation.isPending}
                  variant="primary"
                  className="rounded-xl px-4 py-2.5 text-sm font-black text-white flex items-center gap-2"
                >
                  {bulkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("moderation.submitBulkReject")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
