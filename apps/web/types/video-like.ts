import type { VideoRepostUser } from "./video";

export interface VideoStatsResponse {
  videoId: number;
  liked: boolean;
  viewCount?: number;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  reposted?: boolean;
  repostedBy?: VideoRepostUser[];
}
