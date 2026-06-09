"use client";

import VideoCard from "@/components/video/VideoCard";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useInfiniteVideos } from "@/hooks/video-hooks";
import { useCallback, useEffect, useRef } from "react";
import { Video } from "@/types/video";

const FEED_PAGE_SIZE = 5;
const LOAD_MORE_DISTANCE_PX = 220;

function TikTokFeedLoader() {
  return (
    <div className="relative h-8 w-14" role="status" aria-label="Đang tải thêm video">
      <span className="feed-loader-dot feed-loader-dot-cyan" />
      <span className="feed-loader-dot feed-loader-dot-red" />
      <style jsx>{`
        .feed-loader-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          animation: feed-loader-orbit 0.78s ease-in-out infinite;
          box-shadow: 0 0 14px currentColor;
        }

        .feed-loader-dot-cyan {
          color: #25f4ee;
          background: #25f4ee;
          animation-delay: -0.39s;
        }

        .feed-loader-dot-red {
          color: #fe2c55;
          background: #fe2c55;
        }

        @keyframes feed-loader-orbit {
          0% {
            transform: translate(calc(-50% - 12px), -50%) scale(0.86);
            z-index: 1;
          }
          50% {
            transform: translate(calc(-50% + 12px), -50%) scale(1.08);
            z-index: 2;
          }
          100% {
            transform: translate(calc(-50% - 12px), -50%) scale(0.86);
            z-index: 1;
          }
        }
      `}</style>
    </div>
  );
}

function FeedLoadFooter({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className="flex h-28 w-full items-start justify-center pt-5"
      style={{ scrollSnapAlign: "none" }}
    >
      <TikTokFeedLoader />
    </div>
  );
}

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

export default function FeedPage() {
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteVideos(FEED_PAGE_SIZE);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver>(null);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const hasNextPageRef = useRef(hasNextPage);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  const requestNextPage = useCallback(() => {
    if (!hasNextPageRef.current || isFetchingNextPageRef.current) {
      return;
    }

    isFetchingNextPageRef.current = true;
    fetchNextPage().catch(() => {
      isFetchingNextPageRef.current = false;
    });
  }, [fetchNextPage]);

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  useEffect(() => {
    const handleVideoChange = (e: Event) => {
      const { videoId } = (e as CustomEvent<{ videoId: number }>).detail;
      const container = scrollContainerRef.current;
      if (!container) return;
      const target = container.querySelector(
        `[data-feed-video-id="${videoId}"]`,
      );
      if (target) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    };

    window.addEventListener("feed:video-change", handleVideoChange);
    return () =>
      window.removeEventListener("feed:video-change", handleVideoChange);
  }, []);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (isLoading || !hasNextPage || !node) return;
    
    observer.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting) requestNextPage();
    }, {
      root: scrollContainerRef.current,
      rootMargin: "320px 0px",
      threshold: 0.01,
    });

    observer.current.observe(node);
  }, [isLoading, hasNextPage, requestNextPage]);

  const handleFeedScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom <= LOAD_MORE_DISTANCE_PX) {
      requestNextPage();
    }
  }, [requestNextPage]);

  const allVideos = Array.from(
    new Map(
      (data?.pages.flatMap((page) => page.data ?? []) ?? [])
        .filter((video) => video?.id != null)
        .map((video) => [video.id, video])
    ).values()
  );
  return (
    <>
      <DocumentTitle title="TopTop - Make Your Day" />
      <div
        ref={scrollContainerRef}
        onScroll={handleFeedScroll}
        className="h-full overflow-y-auto custom-scrollbar relative"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          overflowAnchor: "none",
        } as React.CSSProperties}
      >
        {isLoading && (
          <>
            <VideoSkeleton />
            <VideoSkeleton />
          </>
        )}

        {isError && (
          <div
            className="h-full flex items-center justify-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <div className="text-center space-y-3 p-8">
              <p className="text-text-muted text-[15px]">Không thể tải video. Vui lòng thử lại.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && allVideos.length === 0 && (
          <div
            className="h-full flex items-center justify-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <p className="text-text-muted text-[15px]">Chưa có video nào.</p>
          </div>
        )}

        {allVideos.map((video: Video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
          />
        ))}

        {hasNextPage && allVideos.length > 0 && (
          <FeedLoadFooter ref={loadMoreRef} />
        )}
      </div>

      {/* Navigation Arrows */}
      {/* <div className="absolute right-5 bottom-32 flex flex-col gap-2 z-40 hidden xl:flex">
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div> */}
    </>
  );
}
