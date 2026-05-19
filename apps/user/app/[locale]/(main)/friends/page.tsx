"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFriendsCount, useFriendsFeed } from "@/hooks/friend-hooks";
import VideoCard from "@/components/video/VideoCard";
import type { Video } from "@/types/video";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

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

export default function FriendsPage() {
  const t = useTranslations("friends");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;
  const { data: friendsCountData, isLoading: isFriendsCountLoading } = useFriendsCount(isAuthenticated);
  const hasFriends = (friendsCountData?.data ?? 0) > 0;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFriendsFeed(isAuthenticated && hasFriends);

  useEffect(() => {
    if (!isAuthenticated || (!isFriendsCountLoading && !hasFriends)) {
      router.replace("/");
    }
  }, [hasFriends, isAuthenticated, isFriendsCountLoading, router]);

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

  if (!isAuthenticated || isFriendsCountLoading || !hasFriends) {
    return (
      <div className="h-full overflow-y-hidden relative bg-black">
        <VideoSkeleton />
      </div>
    );
  }

  // If authenticated but loading the feed for the first time
  if (isLoading) {
    return (
      <div className="h-full overflow-y-hidden relative bg-black">
        <VideoSkeleton />
      </div>
    );
  }

  // If there's an API error
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-3 p-8">
          <p className="text-zinc-400 text-[15px]">{t("loadError")}</p>
        </div>
      </div>
    );
  }

  const allVideos = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  // If authenticated and has friends but their feed has no videos yet
  if (allVideos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-3 p-8">
          <p className="text-zinc-400 text-[15px]">{t("noVideos")}</p>
        </div>
      </div>
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
