export type LivestreamStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
export type LivestreamVisibility = "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
export type ParticipantRole = "HOST" | "VIEWER" | "MODERATOR";
export type ChatMessageType = "CHAT" | "SYSTEM" | "GIFT" | "REACTION_SUMMARY" | "MODERATION";

export interface HostSummary {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  isFollowing: boolean;
}

export interface LivestreamResponse {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: LivestreamStatus;
  visibility: LivestreamVisibility;
  allowChat: boolean;
  allowGifts: boolean;
  roomName: string;
  viewerCount: number;
  likeCount: number;
  giftCount: number;
  categoryName: string;
  host: HostSummary;
  startedAt: string;
  createdAt: string;
}

export interface JoinLivestreamResponse {
  livestreamId: number;
  roomName: string;
  livekitUrl: string;
  token: string;
  role: ParticipantRole;
}

export interface LiveChatMessageResponse {
  id: number;
  livestreamId: number;
  type: ChatMessageType;
  sender: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  message: string;
  isPinned: boolean;
  createdAt: string;
}

export interface GiftCatalogResponse {
  id: number;
  name: string;
  iconUrl: string;
  animationUrl: string;
  coinPrice: number;
}

export interface CreateLivestreamRequest {
  title: string;
  description?: string;
  categoryId?: number;
  thumbnailUrl?: string;
  visibility?: LivestreamVisibility;
  allowChat?: boolean;
  allowGifts?: boolean;
}

export interface SendChatMessageRequest {
  message: string;
}

export interface SendGiftRequest {
  giftId: number;
  quantity: number;
}
