export interface CommentResponse {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  username: string;
  userAvatarUrl?: string;
  videoId: number;
  parentId?: number;
}
