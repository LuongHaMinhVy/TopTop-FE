"use client";

import { Heart } from "lucide-react";

export interface FloatingHeart {
  id: number;
  offset: number;
  size: number;
}

interface FloatingHeartLayerProps {
  hearts: FloatingHeart[];
}

export default function FloatingHeartLayer({ hearts }: FloatingHeartLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute bottom-28 animate-live-heart-float fill-brand text-brand drop-shadow-lg"
          style={{
            right: 40 + heart.offset,
            width: heart.size,
            height: heart.size,
          }}
        />
      ))}
    </div>
  );
}
