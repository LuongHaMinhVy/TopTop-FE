"use client";

import { Music } from "lucide-react";
import { useRouter } from "next/navigation";
import type { VideoSound } from "@/types/sound";

interface SoundBadgeProps {
  sound?: VideoSound | null;
  fallbackLabel?: string;
  className?: string;
}

export function SoundBadge({ sound, fallbackLabel, className = "" }: SoundBadgeProps) {
  const router = useRouter();
  const label = sound?.title || fallbackLabel;

  if (!label) return null;

  return (
    <button
      type="button"
      disabled={!sound?.id}
      onClick={(event) => {
        event.stopPropagation();
        if (sound?.id) router.push(`/music/${sound.id}`);
      }}
      className={`flex min-w-0 max-w-full items-center gap-1.5 text-left text-[13px] font-semibold text-white/90 transition hover:text-white disabled:cursor-default disabled:hover:text-white/90 ${className}`}
      title={label}
    >
      <Music className="size-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
