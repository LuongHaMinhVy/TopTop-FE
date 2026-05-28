"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { getVideoModerationQueue } from "@/services/moderation-api-service";
import { getAdminSounds } from "@/services/sound-api-service";
import type { ModerationQueueItem, SoundItem } from "@/types/admin";

const emptyModerationItems: ModerationQueueItem[] = [];
const emptySoundItems: SoundItem[] = [];

export default function AdminOverviewPage() {
  const [reviewVideoId, setReviewVideoId] = useState<number | null>(null);

  const moderationQuery = useQuery({
    queryKey: ["admin", "moderation", "NEED_REVIEW"],
    queryFn: () =>
      getVideoModerationQueue({
        status: "NEED_REVIEW",
        page: 0,
        size: 8,
      }),
  });

  const soundsQuery = useQuery({
    queryKey: ["admin", "sounds", ""],
    queryFn: () =>
      getAdminSounds({
        page: 0,
        size: 6,
      }),
  });

  const moderationItems =
    moderationQuery.data?.data?.content ?? emptyModerationItems;
  const soundItems = soundsQuery.data?.data ?? emptySoundItems;

  return (
    <div className="space-y-5">
      <DashboardStatsGrid />

      <OverviewSection
        moderationItems={moderationItems}
        soundItems={soundItems}
        isModerationLoading={moderationQuery.isLoading}
        isSoundLoading={soundsQuery.isLoading}
        onReview={setReviewVideoId}
      />

      {reviewVideoId !== null && (
        <ReviewModal
          videoId={reviewVideoId}
          onClose={() => setReviewVideoId(null)}
        />
      )}
    </div>
  );
}
