"use client";

import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFollowingFeed } from "@/hooks/following-hooks";
import VideoCard from "@/components/video/VideoCard";
import FollowingSuggestionsGrid from "@/components/following/FollowingSuggestionsGrid";
import type { Video } from "@/types/video";
import { useTranslations } from "next-intl";
import { DocumentTitle } from "@/components/shared/DocumentTitle";

function VideoSkeleton() {
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      <div className="flex flex-row items-end gap-4 w-full sm:w-auto h-full sm:h-auto justify-center">
        <div className="relative flex-shrink-0 bg-[#1a1a1a] w-full h-full sm:w-[360px] sm:h-[640px] sm:rounded-xl animate-pulse" />
        <div className="hidden sm:flex flex-col gap-4 pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FollowingPage() {
  const t = useTranslations("following");
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFollowingFeed(isAuthenticated);

  const observer = useRef<IntersectionObserver>(null);
  const lastVideoRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // If not logged in, show Guest suggested grid directly
  if (!isAuthenticated) {
    return (
      <>
        <DocumentTitle title="Following | TopTop" />
        <FollowingSuggestionsGrid reason="GUEST" />
      </>
    );
  }

  // If authenticated but loading the feed for the first time
  if (isLoading) {
    return (
      <div className="h-full overflow-y-hidden relative bg-black">
        <DocumentTitle title="Following | TopTop" />
        <VideoSkeleton />
      </div>
    );
  }

  // If there's an API error
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <DocumentTitle title="Following | TopTop" />
        <div className="text-center space-y-3 p-8">
          <p className="text-zinc-400 text-[15px]">{t('loadError')}</p>
        </div>
      </div>
    );
  }

  const allVideos = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  // If authenticated but has no videos in feed
  if (allVideos.length === 0) {
    const hasFollowing = user.followingCount && user.followingCount > 0;
    return (
      <>
        <DocumentTitle title="Following | TopTop" />
        <FollowingSuggestionsGrid reason={hasFollowing ? "NO_VIDEOS" : "NO_FOLLOWING"} />
      </>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar relative bg-black"
      style={{
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      <DocumentTitle title="Following | TopTop" />
      {allVideos.map((video: Video, index: number) => (
        <VideoCard
          key={video.id}
          video={video}
          ref={allVideos.length === index + 1 ? lastVideoRef : undefined}
        />
      ))}

      {isFetchingNextPage && (
        <div className="h-full flex items-center justify-center" style={{ scrollSnapAlign: "center" }}>
          <VideoSkeleton />
        </div>
      )}
    </div>
  );
}
