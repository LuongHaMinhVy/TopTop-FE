export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ModerationQueueItem = {
  videoId: number;
  caption?: string | null;
  coverUrl?: string | null;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  moderationStatus: string;
  riskScore?: number | null;
  categories?: string[] | null;
  reportCount?: number | null;
  createdAt?: string | null;
  checkedAt?: string | null;
};

export type SoundItem = {
  id: number;
  title?: string | null;
  name?: string | null;
  artistName?: string | null;
  authorUsername?: string | null;
  type?: string | null;
  durationSeconds?: number | null;
  usageCount?: number | null;
  createdAt?: string | null;
};
