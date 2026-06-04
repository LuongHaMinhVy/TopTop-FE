"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLiveFeed } from "@/hooks/live-hooks";
import LiveKitViewer from "./LiveKitViewer";
import { Loader2, Radio } from "lucide-react";
import { Button } from "@repo/ui";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function LiveFeedViewport() {
  const locale = useLocale();
  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading, refetch } = useLiveFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten the feed items from the infinite query pages
  const feedItems = data?.pages.flatMap(page => page.data || []) || [];
  const safeActiveIndex = feedItems.length > 0 ? Math.min(activeIndex, feedItems.length - 1) : 0;

  // Intersection Observer for scroll snapping and determining active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight } = container;
      // Calculate which item is currently taking up the majority of the viewport
      const index = Math.round(scrollTop / clientHeight);
      
      if (index !== safeActiveIndex && index >= 0 && index < feedItems.length) {
        setActiveIndex(index);
      }

      // Fetch more when near bottom
      if (
        scrollTop + clientHeight >= container.scrollHeight - clientHeight &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [safeActiveIndex, feedItems.length, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <Radio className="h-12 w-12 text-white/50" />
        <div>
          <h2 className="text-2xl font-bold">Live feed could not load</h2>
          <p className="mt-2 max-w-md text-sm text-white/60">
            Check your connection and try loading the live feed again.
          </p>
        </div>
        <Button onClick={() => refetch()} className="bg-white text-black hover:bg-white/90">
          Retry
        </Button>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black flex-col gap-4 text-white">
        <h2 className="text-2xl font-bold">No live streams right now</h2>
        <p className="text-white/60 text-center max-w-md">
          Check back later to see what your favorite creators are up to!
        </p>
        <Link href="/lives/studio">
          <Button className="bg-brand text-white">
            Go Live
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

      <Link
        href="/lives/studio"
        className="fixed left-4 top-20 z-50 inline-flex min-h-[58px] items-center gap-3 rounded-lg border border-elevated bg-surface-secondary px-6 py-3 text-text-primary shadow-2xl transition-colors hover:bg-elevated sm:left-5"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-text-primary text-background">
          <Radio className="h-4 w-4" />
        </span>
        <span className="text-[16px] font-bold leading-none">
          {locale === "vi" ? "Bắt đầu phát" : "Go Live"}
        </span>
      </Link>
      
      {feedItems.map((stream, index) => (
        <div 
          key={`${stream.id}-${index}`} 
          className="w-full h-full snap-start snap-always relative bg-black"
        >
          {/* Only render LiveKit for the active stream or immediate neighbors to save resources */}
          {Math.abs(safeActiveIndex - index) <= 1 ? (
             <LiveKitViewer 
               streamId={stream.id} 
               isActive={safeActiveIndex === index} 
               initialStream={stream}
               previewMode={true}
             />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={stream.thumbnailUrl || stream.host?.avatarUrl || "/placeholder.jpg"} 
                className="w-full h-full object-cover blur-xl opacity-20"
                alt="Placeholder"
              />
            </div>
          )}
        </div>
      ))}
      
      {isFetchingNextPage && (
        <div className="w-full h-full snap-start flex items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      )}
    </div>
  );
}
