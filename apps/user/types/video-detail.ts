export type VideoVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export interface VideoAuthor {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowed: boolean;
  isVerified?: boolean;
}

export interface VideoMusic {
  id: number | null;
  title: string;
  authorName?: string | null;
  originalSound: boolean;
}

export interface VideoStats {
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
}

export interface VideoDetail {
  id: number;
  videoId: string;
  author: VideoAuthor;
  caption: string;
  videoUrl: string;
  coverUrl: string | null;
  durationSeconds: number;
  visibility: VideoVisibility;
  allowComments: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  music: VideoMusic;
  stats: VideoStats;
  hashtags: string[];
  mentions: VideoAuthor[];
}

export interface RecommendedVideo {
  id: number;
  videoId: string;
  username: string;
  caption: string;
  coverUrl: string;
  videoUrl?: string;
  likeCount: number;
  viewCount: number;
}

export interface VideoComment {
  id: number;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  author: VideoAuthor;
  repliesCount: number;
}
