import { Heart, MessageCircle, Share2, Bookmark, Music, Plus, Volume2, VolumeX, Play, Pause, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMuted, setVolume, toggleMuted } from "@/store/slices/mediaSlice";
import { InteractionButton } from "./InteractionButton";

interface VideoCardProps {
  index: number;
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

export default function VideoCard({
  index,
  videoUrl,
  username = "baprang4k",
  caption = "80% SINH VIÊN KHÔNG BIẾT NHỮNG MẸO NGẦM TÂM LÝ KHI BẢO VỆ KLTN...",
  sound = "Original sound - baprang4k",
  aspectRatio = "9/16",
  avatarUrl = "https://i.pinimg.com/736x/7d/46/e8/7d46e8ca8d23441a71ddcb1df89b7ba5.jpg",
  likes = "4549",
  comments = "8",
  saves = "2292",
  shares = "495",
}: VideoCardProps) {
  const dispatch = useDispatch();
  const isMuted = useSelector((state: RootState) => state.media.isMuted);
  const volume = useSelector((state: RootState) => state.media.volume);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControlIcon, setShowControlIcon] = useState(false);
  const [iconType, setIconType] = useState<"play" | "pause">("play");
  const [progress, setProgress] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const ratioParts = (aspectRatio || "9/16").split("/");
  const isWide = ratioParts.length === 2 && parseInt(ratioParts[0]) / parseInt(ratioParts[1]) > 1;

  const videoRef = useRef<HTMLVideoElement>(null);
  const isIntersectingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (isIntersectingRef.current && isPlayingRef.current) {
        videoRef.current?.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            if (!document.hidden) {
              videoRef.current.play().catch(() => {});
              setIsPlaying(true);
            } else {
              setIsPlaying(true);
            }
          }
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIconType("pause");
      } else {
        videoRef.current.play();
        setIconType("play");
      }
      setIsPlaying(!isPlaying);
      setShowControlIcon(true);
      setTimeout(() => setShowControlIcon(false), 500);
    }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && videoRef.current.duration) {
      const val = parseFloat(e.target.value);
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
      dispatch(setMuted(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    dispatch(setVolume(newVolume));
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  /* ── Reusable interaction sidebar ── */
  const InteractionSidebar = ({ overlay = false }: { overlay?: boolean }) => (
    <div className={`flex flex-col items-center gap-3 ${overlay ? "" : "pb-10"}`}>
      {/* Avatar */}
      <div className="relative mb-1">
        <div className={`${overlay ? "w-10 h-10" : "w-12 h-12"} rounded-full border-2 border-white/20 overflow-hidden cursor-pointer shadow-lg flex-shrink-0`}>
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        </div>
        <button className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-brand flex items-center justify-center text-white hover:scale-110 transition-transform border-2 border-background shadow">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <InteractionButton
        active={isLiked}
        activeColor="text-brand"
        icon={<Heart className={`w-7 h-7 ${isLiked ? "fill-brand" : ""}`} />}
        label={likes}
        onClick={() => setIsLiked(!isLiked)}
        isOverlay={overlay}
      />
      <InteractionButton
        icon={<MessageCircle className="w-7 h-7" />}
        label={comments}
        isOverlay={overlay}
      />
      <InteractionButton
        active={isSaved}
        activeColor="text-yellow-400"
        icon={<Bookmark className={`w-7 h-7 ${isSaved ? "fill-yellow-400" : ""}`} />}
        label={saves}
        onClick={() => setIsSaved(!isSaved)}
        isOverlay={overlay}
      />
      <InteractionButton
        icon={<Share2 className="w-7 h-7" />}
        label={shares}
        isOverlay={overlay}
      />
      {!overlay && (
        <InteractionButton
          icon={<MoreHorizontal className="w-7 h-7" />}
          label=""
          isOverlay={false}
        />
      )}
    </div>
  );

  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      {/*
        < 640px  (mobile): video full-screen, overlay buttons
        >= 640px (tablet+): centered video + buttons to the right
      */}
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
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {}}
              />

              {/* Play/Pause flash */}
              <div
                className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50
                  transition-all duration-300 transform
                  ${showControlIcon ? "opacity-100 scale-100" : "opacity-0 scale-150"}`}
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                  {iconType === "play"
                    ? <Play className="w-10 h-10 text-white fill-white ml-1" />
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
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className={`flex items-center bg-black/40 backdrop-blur-md rounded-r-full pr-4 pl-1 h-10 transition-all duration-300 origin-left ${showVolumeSlider ? "w-32 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
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
                <InteractionSidebar overlay />
              </div>

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

              {/* Caption / username */}
              <div className="absolute bottom-5 left-3 right-20 sm:right-4 z-20 text-white select-none pointer-events-none">
                <div className="flex items-center gap-2 mb-1 pointer-events-auto">
                  <img src={avatarUrl} alt={username} className="sm:hidden w-8 h-8 rounded-full border border-white/30 object-cover" />
                  <h3 className="font-bold text-[15px] sm:text-[17px] hover:underline cursor-pointer">@{username}</h3>
                </div>
                <p className="text-[13px] sm:text-[14px] line-clamp-2 leading-relaxed opacity-90">
                  {caption}
                </p>
                <div className="flex items-center gap-1.5 mt-2 opacity-80">
                  <Music className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[12px] truncate">{sound}</span>
                </div>
              </div>

              {/* Music disc (tablet+) */}
              <div className="absolute bottom-5 right-4 z-20 hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border-[6px] border-gray-800 flex items-center justify-center animate-spin-slow shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                </div>
              </div>
            </div>
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

        {/* ── Tablet/Desktop interaction sidebar (right of video) ── */}
        <div className="hidden sm:block flex-shrink-0 pb-4">
          <InteractionSidebar />
        </div>
      </div>
    </div>
  );
}
