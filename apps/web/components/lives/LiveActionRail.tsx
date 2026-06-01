"use client";

import { Gift, Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { IconButton } from "@repo/ui";

interface LiveActionRailProps {
  likeCount: number;
  giftCount: number;
  allowGifts: boolean;
  onLike: () => void;
  onGift: () => void;
  onComment: () => void;
  onShare: () => void;
}

const compactCount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

export default function LiveActionRail({
  likeCount,
  giftCount,
  allowGifts,
  onLike,
  onGift,
  onComment,
  onShare,
}: LiveActionRailProps) {
  return (
    <div className="absolute bottom-28 right-3 z-40 flex flex-col items-center gap-4 md:bottom-8 md:right-5">
      <IconButton
        isOverlay
        active
        activeColor="text-brand"
        icon={<Heart className="h-7 w-7 fill-current" />}
        label={compactCount(likeCount)}
        onClick={onLike}
      />
      <IconButton
        isOverlay
        icon={<Gift className="h-7 w-7" />}
        label={compactCount(giftCount)}
        onClick={allowGifts ? onGift : undefined}
        className={allowGifts ? "" : "opacity-50"}
      />
      <IconButton
        isOverlay
        icon={<MessageCircle className="h-7 w-7" />}
        label="Chat"
        onClick={onComment}
      />
      <IconButton
        isOverlay
        icon={<Share2 className="h-7 w-7" />}
        label="Share"
        onClick={onShare}
      />
      <IconButton
        isOverlay
        icon={<MoreHorizontal className="h-7 w-7" />}
        label="More"
      />
    </div>
  );
}
