export interface CommentResponse {
  id: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | null;
  createdAt: string;
  updatedAt?: string | null;
  userId: number;
  username: string;
  userAvatarUrl?: string;
  videoId: number;
  parentId?: number | null;
  timestampInVideo?: number | null;
  author?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
    verified?: boolean;
  };
  likeCount?: number;
  replyCount?: number;
  liked?: boolean;
  canDelete?: boolean;
  deleted?: boolean;
}

export interface CreateCommentRequest {
  videoId: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | null;
  parentId?: number | null;
  timestampInVideo?: number | null;
}

export interface CommentLikeResponse {
  commentId: number;
  liked: boolean;
  likeCount: number;
}
