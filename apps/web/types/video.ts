import type { VideoSound } from "./sound";

export interface Video {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  fileUrl: string;
  duration?: number;
  category?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  userId: number;
  username: string;
  userNickname?: string;
  userAvatarUrl?: string;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowingAuthor?: boolean;
  saveCount?: number;
  shareCount?: number;
  isReposted?: boolean;
  repostedBy?: VideoRepostUser[];
  allowComments?: boolean;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  deleted?: boolean;
  unavailable?: boolean;
  sound?: VideoSound | null;
}

export interface VideoRepostUser {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface VideoUploadData {
  title: string;
  description: string;
  category: string;
}
