"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PictureInPicture, Play, Volume2, VolumeX } from "lucide-react";

import type { Video } from "@/types/video";
import { useRecordVideoViewMutation } from "@/hooks/video-hooks";
import { useVideoContextMenu } from "@/hooks/use-video-context-menu";
import { VideoContextMenu } from "./VideoContextMenu";

type VideoPlayerControlsVariant = "default" | "profile-detail";

interface VideoPlayerContainerProps {
  video: Video;
  className?: string;
  onCopyLink: () => void | Promise<void>;
  onOpenSendModal: () => void;
  onOpenVideoInfo: () => void;
  onBlockUser?: () => void;
  blockLabel?: string;
  isActive?: boolean;
  controlsVariant?: VideoPlayerControlsVariant;
}

function formatVideoTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "00:00";

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VideoPlayerContainer({
  video,
  className = "",
  onCopyLink,
  onOpenSendModal,
  onOpenVideoInfo,
  onBlockUser,
  blockLabel,
  isActive,
  controlsVariant = "default",
}: VideoPlayerContainerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<number | null>(null);
  const lastProgressRef = useRef(0);
  const wasPlayingBeforeHiddenRef = useRef(false);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProfileDetailControls = controlsVariant === "profile-detail";
  const profileDetailAspectRatio = detectedAspectRatio ?? 9 / 16;
  const { mutate: recordVideoView } = useRecordVideoViewMutation();

  const { isOpen, position, openMenu, closeMenu } = useVideoContextMenu();

  useEffect(() => {
    const player = videoRef.current;
    if (!player || isActive === undefined) return;

    if (isActive) {
      player.play().catch(() => {});
      return;
    }

    player.pause();
    player.currentTime = 0;

    const frameId = requestAnimationFrame(() => {
      lastProgressRef.current = 0;
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(false);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isActive, video.id]);

  useEffect(() => {
    const shouldTrack = isPlaying && (isActive ?? true);
    if (!shouldTrack) {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
      return;
    }

    const storageKey = `viewed_video_${video.id}`;
    if (sessionStorage.getItem(storageKey)) return;

    viewTimerRef.current = setTimeout(() => {
      sessionStorage.setItem(storageKey, "1");
      recordVideoView(video.id);
      viewTimerRef.current = null;
    }, 2000);

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [isActive, isPlaying, recordVideoView, video.id]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    const handleEnterPip = () => setIsPipActive(true);
    const handleLeavePip = () => setIsPipActive(false);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = !player.paused;
        player.pause();
        return;
      }

      if (wasPlayingBeforeHiddenRef.current && (isActive ?? true)) {
        player.play().catch(() => {});
      }
      wasPlayingBeforeHiddenRef.current = false;
    };

    player.addEventListener("enterpictureinpicture", handleEnterPip);
    player.addEventListener("leavepictureinpicture", handleLeavePip);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      player.removeEventListener("enterpictureinpicture", handleEnterPip);
      player.removeEventListener("leavepictureinpicture", handleLeavePip);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive, video.id]);

  const handleToggleMute = () => {
    const player = videoRef.current;
    if (!player) return;

    const nextMuted = !player.muted;
    player.muted = nextMuted;

    if (!nextMuted && volume === 0) {
      player.volume = 0.5;
      setVolume(0.5);
    }

    setIsMuted(player.muted);
  };

  const togglePlay = useCallback(() => {
    const player = videoRef.current;
    if (!player) return;

    if (player.paused) {
      player.play().catch(() => {});
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const player = videoRef.current;
    if (!player || !player.duration) return;

    const nextProgress = (player.currentTime / player.duration) * 100;
    if (Math.abs(nextProgress - lastProgressRef.current) > 0.5) {
      lastProgressRef.current = nextProgress;
      setProgress(nextProgress);
      setCurrentTime(player.currentTime);
    }
  }, []);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const player = videoRef.current;
    if (!player || !player.duration) return;

    const nextProgress = Number(event.target.value);
    player.currentTime = (nextProgress / 100) * player.duration;
    lastProgressRef.current = nextProgress;
    setProgress(nextProgress);
    setCurrentTime(player.currentTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const player = videoRef.current;
    const nextVolume = Number(event.target.value);

    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);

    if (!player) return;
    player.volume = nextVolume;
    player.muted = nextVolume === 0;
  };

  const togglePictureInPicture = async () => {
    const player = videoRef.current;
    if (!player) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await player.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  const exitPictureInPicture = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Exit PiP error:", error);
    }
  };

  const handleDownload = () => {
    closeMenu();

    const anchor = document.createElement("a");
    anchor.href = video.fileUrl;
    anchor.download = `${video.username}-${video.id}.mp4`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleCopyLink = async () => {
    closeMenu();
    await onCopyLink();
  };

  const handleSendToFriends = () => {
    closeMenu();
    onOpenSendModal();
  };

  const handleViewDetails = () => {
    closeMenu();
    onOpenVideoInfo();
  };

  return (
    <section
      className={`
        relative flex h-full w-full flex-1 items-center justify-center overflow-hidden
        ${isProfileDetailControls ? "bg-black p-0" : "bg-black px-4 py-6"}
        ${className}
      `}
      onContextMenu={openMenu}
    >
      <div
        className={`
          relative flex h-full w-full items-center justify-center overflow-hidden
          ${isProfileDetailControls ? "rounded-none bg-black shadow-none" : "rounded-xl bg-neutral-950 shadow-2xl"}
        `}
      >
        <video
          ref={videoRef}
          src={video.fileUrl}
          poster={video.thumbnailUrl ?? undefined}
          className="h-full w-full cursor-pointer object-contain"
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(event) => {
            const player = event.currentTarget;
            lastProgressRef.current = 0;
            setProgress(0);
            setCurrentTime(0);
            setDuration(Number.isFinite(player.duration) ? player.duration : 0);
            if (player.videoWidth > 0 && player.videoHeight > 0) {
              setDetectedAspectRatio(player.videoWidth / player.videoHeight);
            }
            player.volume = volume;
            player.muted = isMuted;
          }}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {isProfileDetailControls && !isPlaying && !isPipActive && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 z-[70] grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white transition hover:bg-black/30"
            aria-label="Phát video"
          >
            <Play className="ml-1 size-12 fill-current" />
          </button>
        )}

        {isPipActive && (
          <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-[#164453]/80 text-white backdrop-blur-md">
            <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-white/10">
              <PictureInPicture className="size-9" />
            </div>
            <p className="mb-6 text-[28px] font-bold">Đã bật Trình phát nổi</p>
            <button
              type="button"
              onClick={exitPictureInPicture}
              className="rounded-md bg-white/15 px-8 py-4 text-[18px] font-bold hover:bg-white/25"
            >
              Tắt
            </button>
          </div>
        )}

        {isProfileDetailControls ? (
          <>
            <div
              className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-5 group/progress"
              style={{
                width: `max(390px, min(calc(100dvh * ${profileDetailAspectRatio} * 0.38), calc(100% - 520px)))`,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative h-6 min-w-0 flex-1">
                <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/20 border border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-150 group-hover/progress:h-2.5">
                  <div
                    className="h-full bg-white transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 z-[60] size-4 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-transform duration-150 group-hover/progress:scale-110"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  onMouseDown={(event) => event.stopPropagation()}
                  className="absolute inset-0 z-[70] h-full w-full cursor-pointer opacity-0"
                  aria-label="Video progress"
                />
              </div>
              <span className="w-[86px] text-left text-[13px] font-bold tabular-nums text-white">
                {formatVideoTime(currentTime)}/{formatVideoTime(duration)}
              </span>
            </div>

            <div className="absolute bottom-6 right-6 z-[90] flex items-end gap-3">
              <button
                type="button"
                onClick={togglePictureInPicture}
                className="grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                aria-label="Bật trình phát nổi"
              >
                <PictureInPicture size={23} />
              </button>
              <div
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div
                  className={`absolute bottom-14 left-1/2 flex h-[120px] w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white/15 py-4 backdrop-blur transition-all duration-200 ${
                    showVolumeSlider ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-24 w-1 cursor-pointer accent-white"
                    style={{ writingMode: "vertical-lr", direction: "rtl" }}
                    aria-label="Âm lượng"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                  aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={23} /> : <Volume2 size={23} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleToggleMute}
              className="
                absolute right-4 top-4 grid size-10 place-items-center rounded-full
                bg-black/50 text-white backdrop-blur transition hover:bg-black/70
              "
              aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div
              className="absolute bottom-0 left-0 z-50 h-8 w-full group/progress"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute bottom-0 left-0 h-1.5 w-full overflow-hidden rounded-b-xl bg-black/20 border-t border-white/10 transition-all duration-150 group-hover/progress:h-2.5">
                <div
                  className="h-full bg-brand transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div
                className="absolute z-[60] size-4 rounded-full bg-white opacity-0 shadow-[0_0_8px_rgba(0,0,0,0.6)] transition-all duration-150 group-hover/progress:opacity-100 group-hover/progress:scale-110"
                style={{ bottom: "-2px", left: `calc(${progress}% - 8px)` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                onMouseDown={(event) => event.stopPropagation()}
                className="absolute inset-0 z-[70] h-full w-full cursor-pointer opacity-0"
                aria-label="Video progress"
              />
            </div>
          </>
        )}
      </div>

      <VideoContextMenu
        isOpen={isOpen}
        position={position}
        canDownload
        onDownload={handleDownload}
        onSendToFriends={handleSendToFriends}
        onCopyLink={handleCopyLink}
        onViewDetails={handleViewDetails}
        onBlockUser={onBlockUser ? () => {
          closeMenu();
          onBlockUser();
        } : undefined}
        blockLabel={blockLabel}
      />
    </section>
  );
}
