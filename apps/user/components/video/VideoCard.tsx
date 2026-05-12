import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music,
  Plus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoreHorizontal,
  PictureInPicture,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMuted, setVolume, toggleMuted } from "@/store/slices/mediaSlice";
import { VideoOptionsMenu } from "./VideoOptionsMenu";
import { IconButton } from "@repo/ui/icon-button";
import { useTranslations } from "next-intl";
import { Avatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import type { Video } from "@/types/video";

interface InteractionSidebarProps {
  overlay?: boolean;
  avatarUrl: string;
  username: string;
  isLiked: boolean;
  isSaved: boolean;
  likes: string;
  comments: string;
  saves: string;
  shares: string;
  onLike: () => void;
  onSave: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const InteractionSidebar = ({
  overlay = false,
  avatarUrl,
  username,
  isLiked,
  isSaved,
  likes,
  comments,
  saves,
  shares,
  onLike,
  onSave,
}: InteractionSidebarProps) => {
  return (
    <div className={`flex flex-col items-center gap-3 ${overlay ? "" : "pb-10"}`}>
      {/* Avatar */}
      <div className="relative mb-1">
        <Avatar
          src={avatarUrl}
          alt={username}
          size={overlay ? "md" : "lg"}
          className="cursor-pointer"
        />
        <button className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-brand flex items-center justify-center text-white hover:scale-110 transition-transform border-2 border-background shadow">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <IconButton
        active={isLiked}
        activeColor="text-brand"
        icon={<Heart className={`w-7 h-7 ${isLiked ? "fill-brand" : ""}`} />}
        label={likes}
        onClick={onLike}
        isOverlay={overlay}
      />
      <IconButton
        icon={<MessageCircle className="w-7 h-7" />}
        label={comments}
        isOverlay={overlay}
      />
      <IconButton
        active={isSaved}
        activeColor="text-yellow-400"
        icon={<Bookmark className={`w-7 h-7 ${isSaved ? "fill-yellow-400" : ""}`} />}
        label={saves}
        onClick={onSave}
        isOverlay={overlay}
      />
      <IconButton
        icon={<Share2 className="w-7 h-7" />}
        label={shares}
        isOverlay={overlay}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCount(n?: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─────────────────────────────────────────────
// VideoCard Props
// ─────────────────────────────────────────────
interface VideoCardProps {
  video?: Video;
  videoUrl?: string;
  username?: string;
  caption?: string;
  sound?: string;
  aspectRatio?: string;
  avatarUrl?: string;
  likes?: string;
  comments?: string;
  saves?: string;
  shares?: string;
}

// ─────────────────────────────────────────────
// VideoCard
// ─────────────────────────────────────────────
export default function VideoCard({
  video,
  videoUrl: videoUrlProp,
  username: usernameProp = "baprang4k",
  caption: captionProp = "80% SINH VIÊN KHÔNG BIẾT NHỮNG MẸO NGẦM TÂM LÝ KHI BẢO VỆ KLTN...",
  sound = "Original sound - baprang4k",
  aspectRatio = "9/16",
  avatarUrl: avatarUrlProp = "https://i.pinimg.com/736x/7d/46/e8/7d46e8ca8d23441a71ddcb1df89b7ba5.jpg",
  likes: likesProp = "4549",
  comments: commentsProp = "8",
  saves = "2292",
  shares = "495",
}: VideoCardProps) {
  // ── Derived props ──
  const videoUrl  = video ? video.fileUrl                         : videoUrlProp;
  const username  = video ? video.username                        : usernameProp;
  const caption   = video ? (video.description ?? video.title)   : captionProp;
  const avatarUrl = video ? (video.userAvatarUrl ?? avatarUrlProp) : avatarUrlProp;
  const likes     = video ? formatCount(video.likeCount)         : likesProp;
  const comments  = video ? formatCount(video.commentCount)      : commentsProp;

  const t        = useTranslations("video");
  const dispatch = useDispatch();
  const isMuted  = useSelector((state: RootState) => state.media.isMuted);
  const volume   = useSelector((state: RootState) => state.media.volume);
  const autoScroll = useSelector((state: RootState) => state.media.autoScroll);

  // ── State ──
  const [isLiked,         setIsLiked]         = useState(false);
  const [isSaved,         setIsSaved]         = useState(false);
  const [isPlaying,       setIsPlaying]       = useState(true);
  const [showControlIcon, setShowControlIcon] = useState(false);
  const [iconType,        setIconType]        = useState<"play" | "pause">("play");
  const [progress,        setProgress]        = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isPipActive,     setIsPipActive]     = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // ── Refs ──
  const videoRef          = useRef<HTMLVideoElement>(null);
  const menuRef           = useRef<HTMLDivElement>(null);
  const isIntersectingRef = useRef(false);
  const isPlayingRef      = useRef(isPlaying);

  /** FIX 1 — throttle progress: only update when delta > 0.5% */
  const lastProgressRef   = useRef(0);

  /** FIX 2 — debounce togglePlay: prevent double-click jitter */
  const isTogglingRef     = useRef(false);

  /** FIX 3 — control-icon timeout id for proper cleanup */
  const controlIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ratioParts = (aspectRatio || "9/16").split("/");
  const isWide =
    ratioParts.length === 2 &&
    parseInt(ratioParts[0]) / parseInt(ratioParts[1]) > 1;

  // keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ── Click-outside for options menu ──
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptionsMenu]);

  // ── PiP + IntersectionObserver + visibility ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePipEnter = () => setIsPipActive(true);
    const handlePipLeave = () => setIsPipActive(false);
    video.addEventListener("enterpictureinpicture", handlePipEnter);
    video.addEventListener("leavepictureinpicture", handlePipLeave);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (isIntersectingRef.current && isPlayingRef.current) {
        videoRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    /**
     * FIX 3 — removed `currentTime = 0` reset so re-entering the viewport
     * doesn't snap video back to the beginning mid-scroll.
     */
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (videoRef.current && !document.hidden) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else {
            setIsPlaying(true);
          }
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener("enterpictureinpicture", handlePipEnter);
      video.removeEventListener("leavepictureinpicture", handlePipLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  // ── Sync volume from Redux ──
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // ── Cleanup control-icon timer on unmount ──
  useEffect(() => {
    return () => {
      if (controlIconTimerRef.current) clearTimeout(controlIconTimerRef.current);
    };
  }, []);

  // ──────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────

  /**
   * FIX 2 — debounced togglePlay.
   * Ignores rapid repeated taps within 300 ms to prevent lag/jitter.
   */
  const togglePlay = useCallback(() => {
    if (isPipActive || isTogglingRef.current) return;

    isTogglingRef.current = true;
    setTimeout(() => { isTogglingRef.current = false; }, 300);

    const vid = videoRef.current;
    if (!vid) return;

    if (isPlayingRef.current) {
      vid.pause();
      setIconType("pause");
    } else {
      vid.play().catch(() => {});
      setIconType("play");
    }
    setIsPlaying((prev) => !prev);

    // show flash icon
    setShowControlIcon(true);
    if (controlIconTimerRef.current) clearTimeout(controlIconTimerRef.current);
    controlIconTimerRef.current = setTimeout(() => setShowControlIcon(false), 600);
  }, [isPipActive]);

  const exitPip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Exit PiP error:", error);
    }
  };

  /**
   * FIX 1 — throttled time update.
   * Only triggers a React re-render when progress changes by more than 0.5%,
   * cutting setState calls from ~60/s down to ~6/s for a typical video.
   */
  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const newProgress = (vid.currentTime / vid.duration) * 100;
    if (Math.abs(newProgress - lastProgressRef.current) > 0.5) {
      lastProgressRef.current = newProgress;
      setProgress(newProgress);
    }
  }, []);

  const handleEnded = () => {
    if (autoScroll) {
      const snap = videoRef.current?.closest('[style*="scroll-snap-align"]');
      snap?.nextElementSibling?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (vid && vid.duration) {
      const val = parseFloat(e.target.value);
      vid.currentTime = (val / 100) * vid.duration;
      lastProgressRef.current = val;
      setProgress(val);
      dispatch(setMuted(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    dispatch(setVolume(newVolume));
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      <div className="flex flex-row items-end gap-4 w-full sm:w-auto h-full sm:h-auto justify-center">

        {/* ── Video wrapper ── */}
        <div
          className={`
            relative group flex-shrink-0 shadow-2xl bg-black
            w-full h-full rounded-none
            sm:w-auto sm:h-auto sm:rounded-xl
            ${isWide ? "sm:max-h-[60vh]" : "sm:max-h-[min(650px,70vh)]"}
          `}
        >
          {videoUrl ? (
            <>
              <div
                className="relative w-full h-full overflow-hidden rounded-none sm:rounded-xl cursor-pointer"
                onClick={togglePlay}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className={`
                    block w-full h-full object-cover
                    sm:w-auto sm:h-auto sm:object-contain
                    ${isWide ? "sm:max-h-[60vh]" : "sm:max-h-[min(650px,70vh)]"}
                    sm:max-w-full
                  `}
                  loop={!autoScroll}
                  onEnded={handleEnded}
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {}}
                  /**
                   * FIX 4 — GPU-accelerate the video element so compositing
                   * happens on the GPU layer, reducing main-thread jank.
                   */
                  style={{ willChange: "transform" }}
                />

                {/* PiP Overlay */}
                {isPipActive && (
                  <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="p-4 bg-white/10 rounded-full mb-4">
                      <PictureInPicture className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-white font-bold text-lg mb-6">{t("pipActive")}</p>
                    <Button onClick={exitPip} size="md">
                      {t("back")}
                    </Button>
                  </div>
                )}

                {/* FIX 5 — Play/Pause flash: smoother ease-out scale */}
                <div
                  className={`
                    absolute inset-0 flex items-center justify-center
                    pointer-events-none z-50
                    transition-all duration-500 ease-out
                    ${showControlIcon
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.6]"}
                  `}
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                    {iconType === "play"
                      ? <Play  className="w-10 h-10 text-white fill-white ml-1" />
                      : <Pause className="w-10 h-10 text-white fill-white" />}
                  </div>
                </div>

                {/* Top gradient (hover) */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Volume control */}
                <div
                  className="absolute top-4 left-4 z-50 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch(toggleMuted()); }}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                  >
                    {isMuted || volume === 0
                      ? <VolumeX className="w-5 h-5" />
                      : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div
                    className={`
                      flex items-center bg-black/40 backdrop-blur-md
                      rounded-r-full pr-4 pl-1 h-10
                      transition-all duration-300 origin-left
                      ${showVolumeSlider ? "w-32 opacity-100" : "w-0 opacity-0 overflow-hidden"}
                    `}
                  >
                    <input
                      type="range" min="0" max="1" step="0.1" value={volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>

                {/* Mobile overlay interaction buttons */}
                <div className="absolute right-2 bottom-24 sm:hidden flex flex-col items-center gap-2 z-40">
                  <InteractionSidebar
                    overlay
                    avatarUrl={avatarUrl}
                    username={username}
                    isLiked={isLiked}
                    isSaved={isSaved}
                    likes={likes}
                    comments={comments}
                    saves={saves}
                    shares={shares}
                    onLike={() => setIsLiked((p) => !p)}
                    onSave={() => setIsSaved((p) => !p)}
                    videoRef={videoRef}
                  />
                </div>

                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

                {/* Caption / username */}
                <div className="absolute bottom-5 left-3 right-20 sm:right-4 z-20 text-white select-none pointer-events-none">
                  <div className="flex items-center gap-2 mb-1 pointer-events-auto">
                    <Avatar src={avatarUrl} alt={username} size="sm" className="sm:hidden" />
                    <h3 className="font-bold text-[15px] sm:text-[17px] hover:underline cursor-pointer">
                      @{username}
                    </h3>
                  </div>
                  <p className="text-[13px] sm:text-[14px] line-clamp-2 leading-relaxed opacity-90">
                    {caption}
                  </p>
                  <div className="mt-1 pointer-events-auto">
                    <button className="text-[12px] font-bold opacity-80 hover:opacity-100 transition-opacity">
                      {t("seeTranslation")}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 opacity-80">
                    <Music className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[12px] truncate">{sound}</span>
                  </div>
                </div>

                {/* FIX 6 — Music disc: will-change for GPU-accelerated spin */}
                <div className="absolute bottom-5 right-4 z-20 hidden sm:block">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border-[6px] border-gray-800 flex items-center justify-center animate-spin-slow shadow-lg"
                    style={{ willChange: "transform" }}
                  >
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>

              {/* Options Menu */}
              <div
                className="absolute top-4 right-4 z-[100] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ref={menuRef}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setShowOptionsMenu((p) => !p); }}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
                {showOptionsMenu && (
                  <VideoOptionsMenu
                    onClose={() => setShowOptionsMenu(false)}
                    videoRef={videoRef}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              className="bg-[#1f1f1f] w-full h-full sm:rounded-xl"
              style={{ aspectRatio, minHeight: 300 }}
            />
          )}

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 w-full h-6 z-50 group/progress"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute bottom-0 left-0 w-full h-1 group-hover/progress:h-2 transition-all duration-150 bg-white/20 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-brand transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div
              className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150 shadow-[0_0_8px_rgba(255,255,255,0.6)] z-[60]"
              style={{ bottom: "-1px", left: `calc(${progress}% - 6px)` }}
            />
            <input
              type="range" min="0" max="100" value={progress}
              onChange={handleSeek}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[70]"
            />
          </div>
        </div>

        {/* Tablet/Desktop interaction sidebar */}
        <div className="hidden sm:block flex-shrink-0 pb-4">
          <InteractionSidebar
            avatarUrl={avatarUrl}
            username={username}
            isLiked={isLiked}
            isSaved={isSaved}
            likes={likes}
            comments={comments}
            saves={saves}
            shares={shares}
            onLike={() => setIsLiked((p) => !p)}
            onSave={() => setIsSaved((p) => !p)}
            videoRef={videoRef}
          />
        </div>
      </div>
    </div>
  );
}