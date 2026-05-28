"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModerationSection } from "@/components/dashboard/ModerationSection";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { getVideoModerationQueue } from "@/services/moderation-api-service";
import type { ModerationQueueItem } from "@/types/admin";

const emptyModerationItems: ModerationQueueItem[] = [];

export default function AdminModerationPage() {
  const [moderationStatus, setModerationStatus] = useState("NEED_REVIEW");
  const [reviewVideoId, setReviewVideoId] = useState<number | null>(null);

  const moderationQuery = useQuery({
    queryKey: ["admin", "moderation", moderationStatus],
    queryFn: () =>
      getVideoModerationQueue({
        status: moderationStatus,
        page: 0,
        size: 8,
      }),
  });

  const moderationItems =
    moderationQuery.data?.data?.content ?? emptyModerationItems;

  return (
    <>
      <ModerationSection
        items={moderationItems}
        status={moderationStatus}
        onStatusChange={setModerationStatus}
        isLoading={moderationQuery.isLoading}
        isError={moderationQuery.isError}
        onReview={setReviewVideoId}
      />

      {reviewVideoId !== null && (
        <ReviewModal
          videoId={reviewVideoId}
          onClose={() => setReviewVideoId(null)}
        />
      )}
    </>
  );
}
