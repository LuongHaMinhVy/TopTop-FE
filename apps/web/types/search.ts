import type { VideoSound } from "./sound";

export type SearchTab = "top" | "users" | "videos" | "live";
export type SearchType = "ALL" | "TOP" | "USER" | "VIDEO" | "LIVE" | "HASHTAG" | "SOUND";
export type SearchSourceType = "KEYWORD" | "USER" | "HASHTAG" | "SOUND";

export interface SearchUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  verified: boolean;
  followed: boolean;
  followerCount: number;
  totalLikeCount: number;
  bio?: string | null;
}

export interface SearchVideo {
  id: number;
  videoId: string;
  caption: string;
  coverUrl?: string | null;
  videoUrl?: string | null;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  author: SearchUser;
  sound?: VideoSound | null;
}

export interface SearchLive {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  viewerCount: number;
  host: SearchUser;
  live: boolean;
}

export interface SearchHashtag {
  id: number;
  name: string;
  postCount: number;
}

export interface RelatedSearch {
  keyword: string;
  searchCount: number;
}

export interface SearchHistory {
  id: number;
  keyword: string;
  type: SearchType;
  sourceType: SearchSourceType;
  resultTargetId?: number | null;
  searchedAt: string;
}

export interface SearchSuggestion {
  keywords: string[];
  didYouMean?: string | null;
  users: SearchUser[];
  hashtags: SearchHashtag[];
  relatedSearches: RelatedSearch[];
}

export interface SearchTopResult {
  videos: SearchVideo[];
  users: SearchUser[];
  hashtags: SearchHashtag[];
  lives: SearchLive[];
  relatedSearches: RelatedSearch[];
}
