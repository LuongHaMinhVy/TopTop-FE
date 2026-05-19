export interface ConversationParticipantResponseDTO {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  online: boolean;
  lastActiveAt?: string;
}

export type ConversationStatus = 'ACTIVE' | 'REQUESTED' | 'BLOCKED' | 'DELETED';

export interface MessageAttachmentResponseDTO {
  id: number;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  videoId?: number;
  videoTitle?: string;
}

export interface MessageResponseDTO {
  id: number;
  conversationId: number;
  senderId: number;
  type: 'TEXT' | 'VIDEO_SHARE' | 'IMAGE' | 'SYSTEM';
  body?: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'DELETED' | 'FAILED';
  attachment?: MessageAttachmentResponseDTO;
  replyToMessageId?: number;
  clientMessageId: string;
  mine: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationResponseDTO {
  id: number;
  type: 'DIRECT' | 'GROUP';
  status: ConversationStatus;
  targetUser?: ConversationParticipantResponseDTO;
  lastMessage?: MessageResponseDTO;
  lastMessagePreview?: string;
  unreadCount: number;
  muted: boolean;
  pinned: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UnreadCountResponseDTO {
  totalUnread: number;
  requestUnread: number;
}
