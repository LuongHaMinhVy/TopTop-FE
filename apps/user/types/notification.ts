export interface Notification {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actorId: number;
  actorUsername: string;
  actorAvatarUrl?: string;
  videoId?: number;
  videoThumbnailUrl?: string;
}
