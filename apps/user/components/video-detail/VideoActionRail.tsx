"use client";

import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import type { Video } from "@/types/video";
import { formatCount } from "@/utils/format-count";

interface VideoActionRailProps {
  video: Video;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onFocusComments: () => void;
}

export function VideoActionRail({
  video,
  onLike,
  onSave,
  onShare,
  onFocusComments,
}: VideoActionRailProps) {
  return (
    <aside
      className="
        absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center
        gap-4 text-white
      "
    >
      <button
        type="button"
        className="relative size-14 overflow-hidden rounded-full border border-white/20"
        aria-label={`Xem hồ sơ ${video.username}`}
      >
        <Image
          src={video.userAvatarUrl ?? "/images/default-avatar.png"}
          alt={video.username}
          fill
          className="object-cover"
        />
      </button>

      <ActionButton
        active={video.isLiked}
        label={formatCount(video.likeCount)}
        ariaLabel="Thích video"
        onClick={onLike}
        icon={<Heart className={video.isLiked ? "fill-current" : ""} size={26} />}
      />

      <ActionButton
        label={formatCount(video.commentCount)}
        ariaLabel="Xem bình luận"
        onClick={onFocusComments}
        icon={<MessageCircle size={26} />}
      />

      <ActionButton
        active={video.isSaved}
        label={formatCount(video.saveCount ?? 0)}
        ariaLabel="Lưu video"
        onClick={onSave}
        icon={<Bookmark className={video.isSaved ? "fill-current" : ""} size={26} />}
      />

      <ActionButton
        label={formatCount(video.shareCount ?? 0)}
        ariaLabel="Chia sẻ video"
        onClick={onShare}
        icon={<Share2 size={26} />}
      />
    </aside>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
  active?: boolean;
  onClick: () => void;
}

function ActionButton({
  icon,
  label,
  ariaLabel,
  active = false,
  onClick,
}: ActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`
          grid size-12 place-items-center rounded-full bg-neutral-800 text-white
          transition hover:bg-neutral-700
          ${active ? "text-red-500" : ""}
        `}
      >
        {icon}
      </button>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}
