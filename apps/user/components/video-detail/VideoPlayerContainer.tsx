"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Video } from "@/types/video";
import { useVideoContextMenu } from "@/hooks/use-video-context-menu";
import { VideoContextMenu } from "./VideoContextMenu";

interface VideoPlayerContainerProps {
  video: Video;
  className?: string;
  onCopyLink: () => void | Promise<void>;
  onOpenSendModal: () => void;
  onOpenVideoInfo: () => void;
  onBlockUser?: () => void;
  blockLabel?: string;
}

export function VideoPlayerContainer({
  video,
  className = "",
  onCopyLink,
  onOpenSendModal,
  onOpenVideoInfo,
  onBlockUser,
  blockLabel,
}: VideoPlayerContainerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const { isOpen, position, openMenu, closeMenu } = useVideoContextMenu();

  const handleToggleMute = () => {
    const player = videoRef.current;
    if (!player) return;

    player.muted = !player.muted;
    setIsMuted(player.muted);
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
        bg-black px-4 py-6
        ${className}
      `}
      onContextMenu={openMenu}
    >
      <div
        className="
          relative flex h-full w-full items-center justify-center
          overflow-hidden rounded-xl bg-neutral-950 shadow-2xl
        "
      >
        <video
          ref={videoRef}
          src={video.fileUrl}
          poster={video.thumbnailUrl ?? undefined}
          className="h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          onContextMenu={(e) => e.preventDefault()}
        />

        <button
          type="button"
          onClick={handleToggleMute}
          className="
            absolute right-4 top-4 grid size-10 place-items-center rounded-full
            bg-black/50 text-white backdrop-blur transition hover:bg-black/70
          "
          aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
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
