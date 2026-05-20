"use client";

import { useTranslations } from "next-intl";
import { useAllVideos } from "@/hooks/video-hooks";
import Image from "next/image";
import { Heart, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { videoPath } from "@/utils/video-url";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/types/video";
import { formatCount } from "@/utils/format-count";

/* ─────────────────────────────────────────────────────────────
   ExploreVideoCard
   • isActive   → play / pause
   • isMuted    → page-level mute state (shared across all cards)
   • onActivate → called on mouse-enter
   • onToggleMute → called when user clicks the volume button
───────────────────────────────────────────────────────────── */
function ExploreVideoCard({
  video,
  isActive,
  isFirst,
  isMuted,
  onActivate,
  onToggleMute,
}: {
  video: Video;
  isActive: boolean;
  isFirst: boolean;
  isMuted: boolean;
  onActivate: () => void;
  onToggleMute: () => void;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [started, setStarted] = useState(isFirst);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /* Sync mute state to video element whenever it changes */
  useEffect(() => {
    const player = videoRef.current;
    if (player) player.muted = isMuted;
  }, [isMuted]);

  /* Play / pause based on isActive */
  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    if (isActive) {
      player.muted = isMuted;
      player
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Browser blocked unmuted → force muted play (parent will sync)
          player.muted = true;
          player.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    } else {
      player.pause();
    }
    // isMuted intentionally excluded – handled by the sync effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  /* After "started" flips, video element mounts → play if still active */
  useEffect(() => {
    if (!started || !isActive) return;
    const player = videoRef.current;
    if (!player) return;
    player.muted = isMuted;
    player.play().then(() => setIsPlaying(true)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  /* Pause when user switches tabs; resume when they come back */
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      const player = videoRef.current;
      if (!player) return;
      if (document.hidden) {
        player.pause();
      } else {
        player.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const formattedDuration = video.duration
    ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}`
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer bg-black group"
      style={{ aspectRatio: "3/4" }}
      onMouseEnter={() => {
        setIsHovered(true);
        setStarted(true);
        onActivate();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() =>
        router.push(videoPath(video.username, video.id, { from: "explore" }))
      }
    >
      {/* Thumbnail */}
      {(video.thumbnailUrl || video.fileUrl) && (
        <Image
          src={video.thumbnailUrl || video.fileUrl}
          alt={video.title ?? ""}
          fill
          className={`object-cover transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-100"}`}
          sizes="(max-width: 768px) 33vw, (max-width: 1280px) 20vw, 16vw"
        />
      )}

      {/* Video — never unmounted once started */}
      {started && (
        <video
          ref={videoRef}
          src={video.fileUrl}
          poster={video.thumbnailUrl ?? undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isPlaying ? "opacity-100" : "opacity-0"}`}
          loop
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Hover gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
      />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Duration */}
      {formattedDuration && (
        <div className="absolute top-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {formattedDuration}
        </div>
      )}

      {/* Volume button — hover + started */}
      {started && isHovered && (
        <button
          type="button"
          className="absolute top-2 right-2 z-20 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 animate-in fade-in duration-150"
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* Like count */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
        <Heart className="size-3 fill-white" />
        <span className="text-[12px] font-bold">{formatCount(video.likeCount)}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────── */
function ExploreSkeleton() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{ aspectRatio: "3/4" }} className="rounded-xl bg-elevated animate-pulse" />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page — owns activeVideoId AND isMuted (shared across all cards)
───────────────────────────────────────────────────────────── */
export default function ExplorePage() {
  const t = useTranslations("Main");
  const { data, isLoading } = useAllVideos();
  const videos: Video[] = useMemo(() => data?.data ?? [], [data?.data]);

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  // Start unmuted (first video has sound); toggling here affects all cards
  const [isMuted, setIsMuted] = useState(false);
  const displayedActiveVideoId = activeVideoId ?? videos[0]?.id ?? null;

  const tags = ["Trending", "Music", "Dance", "Gaming", "Food", "Fashion"];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <DocumentTitle title="Explore | TopTop" />

      <header className="mb-6">
        <h1 className="text-[24px] font-bold mb-3">{t("sidebar.explore")}</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {tags.map((tag) => (
            <button
              key={tag}
              className="px-4 py-1.5 rounded-full bg-elevated/50 hover:bg-elevated text-[14px] font-semibold transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <ExploreSkeleton />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {videos.map((video, index) => (
            <ExploreVideoCard
              key={video.id}
              video={video}
              isFirst={index === 0}
              isActive={displayedActiveVideoId === video.id}
              isMuted={isMuted}
              onActivate={() => setActiveVideoId(video.id)}
              onToggleMute={() => setIsMuted((m) => !m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
