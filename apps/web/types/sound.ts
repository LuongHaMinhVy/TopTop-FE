export type SoundType = "OFFICIAL" | "ORIGINAL" | "EFFECT";

export interface SoundAuthor {
  id: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean | null;
}

export interface SoundStats {
  soundId?: number;
  usageCount: number;
  videoCount: number;
  savedCount?: number;
  isSaved?: boolean;
}

export interface Sound {
  id: number;
  title: string;
  artistName?: string | null;
  audioUrl: string;
  coverUrl?: string | null;
  durationSeconds: number;
  type: SoundType;
  originalSound: boolean;
  owner?: SoundAuthor | null;
  stats?: SoundStats | null;
  isSaved?: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface SoundDetail extends Sound {
  description?: string | null;
  sourceVideoId?: number | null;
  canUse: boolean;
  canEdit: boolean;
  updatedAt?: string | null;
}

export type VideoSound = Sound;
