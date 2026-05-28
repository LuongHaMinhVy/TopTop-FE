"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Badge, Input } from "@/components/ui";
import { IconActionButton } from "./dashboard-common";
import {
  getVideoModerationDetail,
  reviewVideoModeration,
} from "@/services/moderation-api-service";
import { AlertCircle, Check, Send, X, XCircle } from "lucide-react";
import type { ReviewVideoModerationRequest } from "@/types/admin";

export function ReviewModal({
  videoId,
  onClose,
}: {
  videoId: number;
  onClose: () => void;
}) {
  const t = useTranslations("Admin.dashboard.reviewModal");
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<ReviewVideoModerationRequest["decision"]>("NEED_REVIEW");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonMessage, setReasonMessage] = useState("");

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["admin", "moderation", "detail", videoId],
    queryFn: () => getVideoModerationDetail(videoId),
  });

  const detail = detailData?.data;

  const reviewMutation = useMutation({
    mutationFn: (request: ReviewVideoModerationRequest) =>
      reviewVideoModeration(videoId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({ decision, reasonCode, reasonMessage });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="modal-opacity-solid relative w-full max-w-3xl overflow-hidden rounded-xl border border-elevated bg-background shadow-2xl flex flex-col max-h-[90vh]" data-modal-panel>
        <div className="flex items-center justify-between border-b border-elevated px-6 py-4">
          <h2 className="text-xl font-black">
            {t("title", { id: videoId })}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : detail ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Video Info */}
              <div className="space-y-4">
                <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
                  {detail.videoPreviewUrl ? (
                    <video
                      src={detail.videoPreviewUrl}
                      controls
                      autoPlay
                      className="h-full w-full object-contain"
                    />
                  ) : detail.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.coverUrl} alt={t("coverAlt")} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      {t("noMedia")}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold">{t("caption")}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {detail.caption || t("noCaption")}
                  </p>
                </div>
              </div>

              {/* Moderation Details & Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-bold">{t("aiAnalysis")}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("status")}</span>
                      <Badge variant="info">{detail.moderationStatus}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("overallRisk")}</span>
                      <span className="font-bold">
                        {((detail.riskScore || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("categories")}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {detail.categories?.map((c) => (
                          <Badge key={c} variant="warning" size="sm">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="border-t border-elevated pt-4 font-bold">
                    {t("manualDecision")}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      aria-label={t("approve")}
                      title={t("approve")}
                      onClick={() => setDecision("APPROVE")}
                      className={`flex h-12 items-center justify-center rounded-lg border transition ${
                        decision === "APPROVE"
                          ? "border-green-500 bg-green-500/10 text-green-500"
                          : "border-elevated text-text-muted hover:bg-hover"
                      }`}
                    >
                      <Check className="h-5 w-5" />
                      <span className="sr-only">{t("approve")}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={t("reject")}
                      title={t("reject")}
                      onClick={() => setDecision("REJECT")}
                      className={`flex h-12 items-center justify-center rounded-lg border transition ${
                        decision === "REJECT"
                          ? "border-red-500 bg-red-500/10 text-red-500"
                          : "border-elevated text-text-muted hover:bg-hover"
                      }`}
                    >
                      <XCircle className="h-5 w-5" />
                      <span className="sr-only">{t("reject")}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={t("hold")}
                      title={t("hold")}
                      onClick={() => setDecision("NEED_REVIEW")}
                      className={`flex h-12 items-center justify-center rounded-lg border transition ${
                        decision === "NEED_REVIEW"
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-elevated text-text-muted hover:bg-hover"
                      }`}
                    >
                      <AlertCircle className="h-5 w-5" />
                      <span className="sr-only">{t("hold")}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      label={t("reasonCode")}
                      value={reasonCode}
                      onChange={(e) => setReasonCode(e.target.value)}
                      className="w-full rounded-lg border border-elevated bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                      placeholder={t("reasonCodePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted">{t("reasonMessage")}</label>
                    <textarea
                      value={reasonMessage}
                      onChange={(e) => setReasonMessage(e.target.value)}
                      className="w-full rounded-lg border border-elevated bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none min-h-[80px]"
                      placeholder={t("reasonMessagePlaceholder")}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-elevated">
                    <IconActionButton label={t("cancel")} icon={XCircle} variant="secondary" onClick={onClose} />
                    <IconActionButton
                      type="submit"
                      label={t("submit")}
                      icon={Send}
                      isLoading={reviewMutation.isPending}
                    />
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted">
              {t("loadError")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
