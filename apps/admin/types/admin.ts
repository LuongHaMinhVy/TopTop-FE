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
  artistName?: string | null;
  description?: string | null;
  audioUrl?: string | null;
  coverUrl?: string | null;
  type?: string | null;
  originalSound?: boolean | null;
  owner?: SoundAuthor | null;
  stats?: SoundStats | null;
  isSaved?: boolean | null;
  isPublic?: boolean | null;
  isActive?: boolean | null;
  durationSeconds?: number | null;
  createdAt?: string | null;
};

export type SoundAuthor = {
  id: number;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean | null;
};

export type SoundStats = {
  soundId: number;
  usageCount?: number | null;
  videoCount?: number | null;
  savedCount?: number | null;
  isSaved?: boolean | null;
};

export type VideoModerationFrame = {
  frameIndex: number;
  timestampMs: number;
  riskScore: number;
  categoriesJson?: string;
  qualityIssuesJson?: string;
};

export type ModerationAuditLog = {
  id: number;
  videoId: number;
  adminId?: number;
  adminEmail?: string;
  action: string;
  reasonCode?: string;
  reasonMessage?: string;
  createdAt: string;
};

export type VideoModerationDetail = {
  videoId: number;
  videoPreviewUrl?: string;
  coverUrl?: string;
  caption?: string;
  authorUsername?: string;
  authorAvatarUrl?: string;
  moderationStatus: string;
  riskScore?: number;
  textRiskScore?: number;
  imageRiskScore?: number;
  categories?: string[];
  qualityIssues?: string[];
  qualityIssueMessage?: string;
  frames?: VideoModerationFrame[];
  auditLogs?: ModerationAuditLog[];
  reportCount?: number;
  checkedAt?: string;
};

export type ReviewVideoModerationRequest = {
  decision: "APPROVE" | "REJECT" | "NEED_REVIEW";
  reasonCode?: string;
  reasonMessage?: string;
};

export type VideoModerationSummary = {
  videoId: number;
  moderationStatus: string;
  riskScore?: number;
  reasonCode?: string;
  reasonMessage?: string;
  checkedAt?: string;
  musicCopyrightStatus?: string;
  musicCopyrightReasonCode?: string;
  musicCopyrightReasonMessage?: string;
  musicCopyrightCheckedAt?: string;
  qualityIssues?: string[];
  qualityIssueMessage?: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalVideos: number;
  pendingModerationVideos: number;
  totalReports: number;
};

// ── Admin User ────────────────────────────────────────────────────────────────
export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  verified: boolean;
  isPrivate: boolean;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  statusReason?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  deletionScheduledAt?: string | null;
};

export type AdminUpdateUserStatusRequest = {
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  reason?: string;
};

// ── Admin Report ──────────────────────────────────────────────────────────────
export type AdminReport = {
  id: number;
  reporterId?: number | null;
  reporterUsername?: string | null;
  reporterAvatarUrl?: string | null;
  targetType: "VIDEO" | "VIDEO_POST" | "COMMENT" | "USER" | "MESSAGE" | "LIVE";
  targetId: number;
  reasonId?: number | null;
  reasonCode?: string | null;
  reasonLabel?: string | null;
  additionalNote?: string | null;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  resolutionAction?: ReportResolutionAction | null;
  reviewedBy?: number | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

export type ReportResolutionAction =
  | "NONE"
  | "MARK_VIDEO_NEED_REVIEW"
  | "REMOVE_VIDEO"
  | "DELETE_COMMENT"
  | "SUSPEND_USER"
  | "BAN_USER";

export type ReviewReportRequest = {
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  action?: ReportResolutionAction;
  note?: string;
};

// ── Admin Livestream ─────────────────────────────────────────────────────────
export type AdminLivestreamStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
export type AdminLivestreamVisibility = "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";

export type AdminLivestreamHost = {
  id: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isFollowing?: boolean | null;
};

export type AdminLivestream = {
  id: number;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: AdminLivestreamStatus;
  visibility: AdminLivestreamVisibility;
  allowChat: boolean;
  allowGifts: boolean;
  roomName?: string | null;
  viewerCount: number;
  peakViewerCount: number;
  likeCount: number;
  giftCount: number;
  categoryName?: string | null;
  host: AdminLivestreamHost;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
};

// ── Admin Commerce ───────────────────────────────────────────────────────────
export type AdminShop = {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEED_REVIEW";
};

export type AdminProductMedia = {
  id: number;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  sortOrder: number;
};

export type AdminProduct = {
  id: number;
  shopId: number;
  title: string;
  slug: string;
  description?: string | null;
  categoryId?: number | null;
  basePrice: number;
  currency: string;
  stockQuantity: number;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "HIDDEN" | "BANNED";
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEED_REVIEW";
  media: AdminProductMedia[];
};

export type AdminCommerceOrder = {
  id: number;
  orderCode: string;
  buyerId: number;
  shopId: number;
  shopName: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createdAt: string;
};

// ── Admin Sound Request Payloads ──────────────────────────────────────────────
export type CreateSoundRequest = {
  title: string;
  artistName?: string;
  description?: string;
  type: "OFFICIAL" | "ORIGINAL" | "EFFECT";
  audioUrl: string;
  coverUrl?: string;
  durationSeconds?: number;
  isPublic?: boolean;
};

export type UpdateSoundRequest = {
  title?: string;
  artistName?: string;
  description?: string;
  coverUrl?: string;
  durationSeconds?: number;
  isPublic?: boolean;
  isActive?: boolean;
};

