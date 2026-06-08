export interface PrivacySettings {
  allowComments?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  allowDownload?: boolean;
  allowMessageFromEveryone?: boolean;
  showPosts?: boolean;
  showReposts?: boolean;
  showLikedVideos?: boolean;
  showFavorites?: boolean;
  defaultCommentPermission?: "EVERYONE" | "NO_ONE";
  commentFilter?: string;
  messagePrivacy?: string;
}

export interface ContentFilterTag {
  id: number;
  tag: string;
  sampleThumbnailUrl?: string | null;
  createdAt?: string;
}

export interface RelationshipStatus {
  isFollowing?: boolean;
  isFollower?: boolean;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
  isFriend?: boolean;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  followersCount?: number;
  followingCount?: number;
  totalLikes?: number;
  videoCount?: number;
  verified?: boolean;
  isPrivate?: boolean;
  status?: string;
  accountType?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  gender?: string;
  region?: string;
  dateOfBirth?: string;
  privacySettings?: PrivacySettings;
  relationship?: RelationshipStatus;
  roles: string[];
  onboarded?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
}
