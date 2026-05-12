"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";
import { useAllVideos } from "@/hooks/video-hooks";

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
  const { data, isLoading, isError } = useAllVideos();
  const videos = data?.data ?? [];
  return (
    <>
      <div
        className="h-full overflow-y-auto custom-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
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

        {!isLoading && !isError && videos.length === 0 && (
          <div
            className="h-full flex items-center justify-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <p className="text-text-muted text-[15px]">Chưa có video nào.</p>
          </div>
        )}

        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-5 bottom-32 flex flex-col gap-2 z-40 hidden xl:flex">
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}
