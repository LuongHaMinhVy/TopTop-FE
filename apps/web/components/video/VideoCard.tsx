"use client";

import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Disc3,
  Plus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoreHorizontal,
  PictureInPicture,
  Check,
  CheckCircle,
  AlertCircle,
  Repeat2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { ReportModal } from "@/components/report/ReportModal";
import { CollectionManagePanel } from "@/components/collection/CollectionManagePanel";
import { setMuted, setVolume, toggleMuted } from "@/store/slices/mediaSlice";
import { openAuthModal } from "@/store/slices/authSlice";
import { VideoOptionsMenu } from "./VideoOptionsMenu";
import { ShareModal } from "./ShareModal";
import { RepostBadge } from "./RepostBadge";
import { IconButton } from "@repo/ui/icon-button";
import { useLocale, useTranslations } from "next-intl";
import { useVideoContextMenu } from "@/hooks/use-video-context-menu";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import { VideoContextMenu } from "../video-detail/VideoContextMenu";
import { Avatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import Image from "next/image";
import type { Video } from "@/types/video";
import type { VideoRepostUser } from "@/types/video";
import { useCommentSidebar } from "@/components/layout/CommentSidebarContext";
import {
  useLikeVideoMutation,
  useNotInterestedVideoMutation,
  useRecordVideoViewMutation,
  useRepostVideoMutation,
  useTranslateVideoDescriptionMutation,
  useUnlikeVideoMutation,
  useUnrepostVideoMutation,
} from "@/hooks/video-hooks";
import { useBlockUserMutation, useDynamicFollowMutation, useDynamicUnfollowMutation } from "@/hooks/user-hooks";
import { useSaveVideoMutation, useUnsaveVideoMutation } from "@/hooks/collection-hooks";
import { usePathname, useRouter } from "@/i18n/routing";
import { videoPath } from "@/utils/video-url";

const FEED_VIDEO_LANDSCAPE_MAX_WIDTH = "62vw";
const FEED_VIDEO_MAX_HEIGHT = "calc(100dvh - 32px)";
const FEED_VIDEO_VIEWPORT_WIDTH = "calc(100vw - 32px)";
const FEED_VIDEO_SIDE_CONTROLS_WIDTH = "112px";
const FEED_VIDEO_COMMENT_SIDE_CONTROLS_WIDTH = "192px";
const FEED_VIDEO_RESERVED_COMMENT_SIDE_CONTROLS_WIDTH = "168px";
const COLLECTION_PANEL_WIDTH = 248;
const COLLECTION_PANEL_GAP = 16;
const COLLECTION_PANEL_RIGHT_GAP = 64;

interface InteractionSidebarProps {
  overlay?: boolean;
  avatarUrl: string;
  username: string;
  isLiked: boolean;
  isSaved: boolean;
  likes: string;
  comments: string;
  saves: string;
  shares: string;
  musicLabel?: string;
  onLike: () => void;
  onSave: () => void;
  onShare?: () => void;
  onAvatarClick?: () => void;
  onCommentsClick?: () => void;
  showFollowButton?: boolean;
  isFollowingAuthor?: boolean;
  isFollowPending?: boolean;
  onFollowClick?: () => void;
  soundId?: number;
  soundCoverUrl?: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const InteractionSidebar = ({
  overlay = false,
  avatarUrl,
  username,
  isLiked,
  isSaved,
  likes,
  comments,
  saves,
  shares,
  musicLabel = "Âm thanh",
  onLike,
  onSave,
  onShare,
  onAvatarClick,
  onCommentsClick,
  showFollowButton = true,
  isFollowingAuthor = false,
  isFollowPending = false,
  onFollowClick,
  soundId,
  soundCoverUrl,
}: InteractionSidebarProps) => {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center gap-3 ${overlay ? "" : "pb-10"}`}>
      {/* Avatar */}
      <div className="relative mb-1 group/avatar">
        <div 
          className="relative rounded-full bg-gradient-to-tr from-brand to-pink-500 active:scale-90 transition-transform duration-200 shadow-[0_0_15px_rgba(254,44,85,0.3)] group-hover/avatar:shadow-[0_0_20px_rgba(254,44,85,0.5)]"
          onClick={onAvatarClick}
        >
          <Avatar
            src={avatarUrl}
            alt={username}
            size={overlay ? "md" : "lg"}
            className="cursor-pointer"
            showBorder={false}
          />
        </div>
        {showFollowButton && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFollowClick?.();
            }}
            disabled={isFollowPending}
            className={`absolute -bottom-1 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border-2 border-background shadow-md transition-all duration-200 ${
              isFollowingAuthor
                ? "bg-[#161616] text-brand hover:scale-110"
                : "bg-brand text-white hover:scale-110 group-hover/avatar:bg-brand-dark"
            } ${isFollowPending ? "opacity-60" : ""}`}
          >
            {isFollowingAuthor ? (
              <Check className="block h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <Plus className="block h-3.5 w-3.5 stroke-[3]" />
            )}
          </button>
        )}
      </div>

      <IconButton
        active={isLiked}
        activeColor="text-brand"
        icon={<Heart className={`w-7 h-7 ${isLiked ? "fill-brand" : ""}`} />}
        label={likes}
        onClick={onLike}
        isOverlay={overlay}
      />
      <IconButton
        icon={<MessageCircle className="w-7 h-7" />}
        label={comments}
        onClick={onCommentsClick}
        isOverlay={overlay}
      />
      <IconButton
        active={isSaved}
        activeColor="text-yellow-400"
        icon={<Bookmark className={`w-7 h-7 ${isSaved ? "fill-yellow-400" : ""}`} />}
        label={saves}
        onClick={onSave}
        isOverlay={overlay}
      />
      <IconButton
        icon={<Share2 className="w-7 h-7" />}
        label={shares}
        onClick={onShare}
        isOverlay={overlay}
      />
      <button
        type="button"
        aria-label={musicLabel}
        title={musicLabel}
        disabled={!soundId}
        onClick={(event) => {
          event.stopPropagation();
          if (soundId) router.push(`/music/${soundId}`);
        }}
        className={`
          relative mt-1 grid place-items-center overflow-hidden rounded-full text-white transition hover:scale-105
          ${soundId ? "cursor-pointer" : "cursor-default"}
          ${overlay ? "size-10 bg-black/40 backdrop-blur-sm" : "size-12 bg-neutral-800 hover:bg-neutral-700"}
        `}
      >
        {soundCoverUrl ? (
          <Image src={soundCoverUrl} alt={musicLabel} fill className="object-cover" />
        ) : (
          <Disc3 className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCount(n?: number): string {
  if (n === undefined || n === null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseAspectRatio(value: string): number {
  const [width, height] = value.split("/").map((part) => Number(part));
  if (!width || !height) return 9 / 16;
  return width / height;
}

const VIETNAMESE_DIACRITIC_PATTERN = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const VIETNAMESE_COMMON_WORDS = [
  "anh", "ban", "cho", "cua", "duoc", "em", "hay", "khong", "la", "minh",
  "mot", "nguoi", "nay", "nhung", "toi", "va", "voi",
];
const ENGLISH_COMMON_WORDS = [
  "a", "an", "and", "are", "beautiful", "for", "hello", "in", "is", "like",
  "love", "me", "my", "not", "of", "on", "that", "the", "this", "to",
  "today", "trend", "we", "with", "you", "your",
];

function normalizeTextForLanguageDetection(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\p{L}\p{N}_]+/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countCommonWords(text: string, words: string[]): number {
  if (!text) return 0;
  const tokens = new Set(text.split(/\s+/).filter(Boolean));
  return words.reduce((count, word) => count + (tokens.has(word) ? 1 : 0), 0);
}

function isTextLikelyLocale(text: string, locale: string): boolean {
  const normalizedLocale = locale.toLowerCase();
  const normalizedText = normalizeTextForLanguageDetection(text);
  if (!normalizedText) return true;

  const hasVietnameseDiacritics = VIETNAMESE_DIACRITIC_PATTERN.test(normalizedText);
  const vietnameseMatches = countCommonWords(normalizedText, VIETNAMESE_COMMON_WORDS);
  const englishMatches = countCommonWords(normalizedText, ENGLISH_COMMON_WORDS);

  if (normalizedLocale.startsWith("vi")) {
    return hasVietnameseDiacritics || vietnameseMatches >= 2 || (vietnameseMatches >= 1 && englishMatches === 0);
  }

  if (normalizedLocale.startsWith("en")) {
    return !hasVietnameseDiacritics && englishMatches >= 1 && vietnameseMatches === 0;
  }

  return false;
}

// ─────────────────────────────────────────────
// VideoCard Props
// ─────────────────────────────────────────────
interface VideoCardProps {
  video?: Video;
  videoUrl?: string;
  username?: string;
  caption?: string;
  sound?: string;
  aspectRatio?: string;
  avatarUrl?: string;
  likes?: string;
  comments?: string;
  saves?: string;
  shares?: string;
  detailSource?: string;
  onCommentsClick?: () => void;
  reserveCommentPanelSpace?: boolean;
  stageOffsetX?: string;
}

// ─────────────────────────────────────────────
// VideoCard
// ─────────────────────────────────────────────
export default function VideoCard({
  video,
  videoUrl: videoUrlProp,
  username: usernameProp = "user",
  caption: captionProp = "",
  aspectRatio = "9/16",
  avatarUrl: avatarUrlProp = "",
  likes: likesProp,
  comments: commentsProp,
  saves: savesProp = "0",
  shares: sharesProp = "0",
  detailSource: detailSourceProp,
  onCommentsClick: onCommentsClickProp,
  reserveCommentPanelSpace = false,
  stageOffsetX,
  ref,
}: VideoCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  // ── Derived props ──
  const videoUrl  = video ? video.fileUrl                         : videoUrlProp;
  const username  = (video ? video.username                        : usernameProp) || "user";
  const userNickname = video ? video.userNickname                  : undefined;
  const caption   = video ? (video.description ?? video.title)   : (captionProp || "");
  const avatarUrl = (video ? video.userAvatarUrl                  : avatarUrlProp) || "";
  const initialLikeCount = video ? video.likeCount : Number(likesProp || 0) || 0;
  const comments  = video ? formatCount(video.commentCount)      : (commentsProp || "0");
  const savesFromProps = video ? video.saveCount ?? 0 : Number(savesProp || 0) || 0;
  const shares    = video ? formatCount(video.shareCount ?? 0)   : (sharesProp || "0");
  const videoId = video?.id;
  const soundLabel = video?.sound?.title;

  const t        = useTranslations("video");
  const tCommon  = useTranslations("common");
  const tCollection = useTranslations("Collection");
  const locale = useLocale();
  const dispatch = useDispatch();
  const router   = useRouter();
  const pathname = usePathname();
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [isFavoriteToastLeaving, setIsFavoriteToastLeaving] = useState(false);
  const [isCollectionPanelOpen, setIsCollectionPanelOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [repostOverride, setRepostOverride] = useState<{ videoId: number; value: boolean } | null>(null);
  const [showRepostToast, setShowRepostToast] = useState(false);
  const [copyToast, setCopyToast] = useState<"success" | "error" | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [showTranslatedDescription, setShowTranslatedDescription] = useState(false);
  const {
    activeVideoId: activeCommentVideoId,
    isCommentSidebarAvailable,
    openCommentSidebar,
    toggleCommentSidebar,
  } = useCommentSidebar();

  // Redux state
  const isMuted  = useSelector((state: RootState) => state.media.isMuted);
  const volume   = useSelector((state: RootState) => state.media.volume);
  const autoScroll = useSelector((state: RootState) => state.media.autoScroll);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const isOwnVideo = Boolean(currentUser && video && currentUser.id === video.userId);
  const canRepost = Boolean(video && !isOwnVideo);
  const isReposted =
    video?.id && repostOverride?.videoId === video.id
      ? repostOverride.value
      : (video?.isReposted ?? false);
  const currentRepostUser: VideoRepostUser | null = currentUser
    ? {
        id: currentUser.id,
        username: currentUser.username,
        nickname: currentUser.nickname,
        avatarUrl: currentUser.avatarUrl,
        isCurrentUser: true,
      }
    : null;
  const repostUsers = (() => {
    const users = [...(video?.repostedBy ?? [])];
    const hasCurrentUser = currentRepostUser && users.some((user) => user.id === currentRepostUser.id);
    if (isReposted && currentRepostUser && !hasCurrentUser) {
      return [currentRepostUser, ...users];
    }
    return users;
  })();
  const detailSource = detailSourceProp ??
    (pathname === "/explore"
      ? "explore"
      : pathname === "/friends"
        ? "friends"
        : pathname === "/following"
          ? "following"
          : "feed");

  const likeMutation = useLikeVideoMutation();
  const unlikeMutation = useUnlikeVideoMutation();
  const repostMutation = useRepostVideoMutation();
  const unrepostMutation = useUnrepostVideoMutation();
  const notInterestedMutation = useNotInterestedVideoMutation();
  const translateDescriptionMutation = useTranslateVideoDescriptionMutation();
  const { mutate: recordVideoView } = useRecordVideoViewMutation();
  const saveMutation = useSaveVideoMutation();
  const unsaveMutation = useUnsaveVideoMutation();
  const followMutation = useDynamicFollowMutation();
  const unfollowMutation = useDynamicUnfollowMutation();
  const blockMutation = useBlockUserMutation(username);

  // ── State ──
  const [isLiked,         setIsLiked]         = useState(video?.isLiked ?? false);
  const [likeCount,       setLikeCount]       = useState(initialLikeCount);
  const [isSaved,         setIsSaved]         = useState(video?.isSaved ?? false);
  const [saveCount,       setSaveCount]       = useState(savesFromProps);
  const [followOverride, setFollowOverride] = useState<{ videoId: number; value: boolean } | null>(null);
  const [isPlaying,       setIsPlaying]       = useState(true);
  const [showControlIcon, setShowControlIcon] = useState(false);
  const [iconType,        setIconType]        = useState<"play" | "pause">("play");
  const [progress,        setProgress]        = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isPipActive,     setIsPipActive]     = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [suppressOptionsHover, setSuppressOptionsHover] = useState(false);
  const [isNearViewport,  setIsNearViewport]  = useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<number | null>(null);
  const [collectionPanelSide, setCollectionPanelSide] = useState<"left" | "right">(
    () => (parseAspectRatio(aspectRatio || "9/16") > 1 ? "left" : "right"),
  );

  // ── Refs ──
  const internalRef       = useRef<HTMLDivElement>(null);
  const stageRef          = useRef<HTMLDivElement>(null);
  const videoFrameRef     = useRef<HTMLDivElement>(null);
  const videoRef          = useRef<HTMLVideoElement>(null);
  const menuRef           = useRef<HTMLDivElement>(null);
  const favoriteToastRef  = useRef<HTMLDivElement>(null);
  const isIntersectingRef = useRef(false);
  const isPlayingRef      = useRef(isPlaying);
  const wasPlayingBeforeHiddenRef = useRef(false);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to merge internal and external refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  /** FIX 1 — throttle progress: only update when delta > 0.5% */
  const lastProgressRef   = useRef(0);

  // Context Menu Logic
  const { isOpen: isCtxOpen, position: ctxPos, openMenu, closeMenu } = useVideoContextMenu();
  const isFollowingAuthor =
    video?.id && followOverride?.videoId === video.id
      ? followOverride.value
      : (video?.isFollowingAuthor ?? false);

  const hideFavoriteToast = useCallback(() => {
    setIsFavoriteToastLeaving(true);
    window.setTimeout(() => {
      setShowFavoriteToast(false);
      setIsFavoriteToastLeaving(false);
    }, 220);
  }, []);

  const handleCopyLink = async () => {
    if (video) {
        const url = `${window.location.origin}${videoPath(video.username, video.id)}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopyToast("success");
        } catch {
          setCopyToast("error");
        }
        window.setTimeout(() => setCopyToast(null), 2500);
        closeMenu();
    }
  };

  const handleRepost = () => {
    if (!video?.id) return;
    if (!canRepost) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }
    if (repostMutation.isPending || unrepostMutation.isPending) return;

    const previousReposted = isReposted;
    setRepostOverride({ videoId: video.id, value: true });
    setShowRepostToast(true);
    setTimeout(() => setShowRepostToast(false), 2500);

    repostMutation.mutate(video.id, {
      onSuccess: (response) => {
        if (response.data?.reposted !== undefined) {
          setRepostOverride({ videoId: video.id, value: response.data.reposted });
        }
      },
      onError: () => {
        setRepostOverride({ videoId: video.id, value: previousReposted });
        setShowRepostToast(false);
      },
    });
  };

  const handleRemoveRepost = () => {
    if (!video?.id) return;
    if (!canRepost) return;
    if (repostMutation.isPending || unrepostMutation.isPending) return;

    const previousReposted = isReposted;
    if (video?.id) setRepostOverride({ videoId: video.id, value: false });
    setShowRepostToast(false);

    unrepostMutation.mutate(video.id, {
      onSuccess: (response) => {
        if (response.data?.reposted !== undefined) {
          setRepostOverride({ videoId: video.id, value: response.data.reposted });
        }
      },
      onError: () => setRepostOverride({ videoId: video.id, value: previousReposted }),
    });
  };

  const handleDownload = () => {
    if (video) {
        const anchor = document.createElement("a");
        anchor.href = video.fileUrl;
        anchor.download = `${video.username}-${video.id}.mp4`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        closeMenu();
    }
  };

  const handleNotInterested = () => {
    if (!video?.id) return;
    if (isOwnVideo) {
      closeMenu();
      setShowOptionsMenu(false);
      return;
    }
    if (isLiked || isSaved) {
      closeMenu();
      setShowOptionsMenu(false);
      return;
    }
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      closeMenu();
      setShowOptionsMenu(false);
      return;
    }
    notInterestedMutation.mutate(video.id);
    closeMenu();
    setShowOptionsMenu(false);
  };

  /** FIX 2 — debounce togglePlay: prevent double-click jitter */
  const isTogglingRef     = useRef(false);

  /** FIX 3 — control-icon timeout id for proper cleanup */
  const controlIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoAspectRatio = detectedAspectRatio ?? parseAspectRatio(aspectRatio || "9/16");
  const isCommentSidebarOpen = reserveCommentPanelSpace || activeCommentVideoId !== null;
  const isExternalFeedCommentOpen =
    !reserveCommentPanelSpace && detailSource === "feed" && activeCommentVideoId !== null;
  const isLandscape = videoAspectRatio > 1;
  const updateCollectionPanelSide = useCallback(() => {
    if (isLandscape) {
      setCollectionPanelSide("left");
      return;
    }

    const frame = videoFrameRef.current;
    if (!frame) {
      setCollectionPanelSide("right");
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const actionRailViewportLeft = frameRect.right + 24;
    const rightPanelEdge =
      actionRailViewportLeft + COLLECTION_PANEL_RIGHT_GAP + COLLECTION_PANEL_WIDTH;

    setCollectionPanelSide(rightPanelEdge > window.innerWidth - 16 ? "left" : "right");
  }, [isLandscape]);
  const resolvedStageOffsetX =
    stageOffsetX ??
    (isExternalFeedCommentOpen
      ? isLandscape
        ? "clamp(-48px, -2.5vw, -24px)"
        : "clamp(-72px, -4vw, -40px)"
      : isLandscape
        ? "clamp(-96px, -5vw, -56px)"
        : "clamp(-96px, -5vw, -56px)");
  const feedVideoSideControlsWidth =
    reserveCommentPanelSpace && detailSource === "feed"
      ? FEED_VIDEO_RESERVED_COMMENT_SIDE_CONTROLS_WIDTH
      : isCommentSidebarOpen
        ? FEED_VIDEO_COMMENT_SIDE_CONTROLS_WIDTH
        : FEED_VIDEO_SIDE_CONTROLS_WIDTH;
  const feedVideoAvailableWidth = `calc(100% - ${feedVideoSideControlsWidth})`;
  const feedVideoLandscapeMaxWidth = isCommentSidebarOpen
    ? `min(${FEED_VIDEO_LANDSCAPE_MAX_WIDTH}, ${feedVideoAvailableWidth})`
    : FEED_VIDEO_LANDSCAPE_MAX_WIDTH;
  const feedVideoFrameWidth = isLandscape
    ? `min(${feedVideoLandscapeMaxWidth}, calc(${FEED_VIDEO_MAX_HEIGHT} * ${videoAspectRatio}))`
    : `min(calc(${FEED_VIDEO_MAX_HEIGHT} * ${videoAspectRatio}), ${FEED_VIDEO_VIEWPORT_WIDTH})`;
  const feedVideoFrameHeight = isLandscape
    ? `calc(${feedVideoFrameWidth} / ${videoAspectRatio})`
    : `min(${FEED_VIDEO_MAX_HEIGHT}, calc(${FEED_VIDEO_VIEWPORT_WIDTH} / ${videoAspectRatio}))`;
  const videoFrameStyle = {
    "--feed-video-ratio": String(videoAspectRatio),
    aspectRatio: String(videoAspectRatio),
    width: feedVideoFrameWidth,
    height: feedVideoFrameHeight,
    maxWidth: isLandscape ? feedVideoLandscapeMaxWidth : feedVideoFrameWidth,
    maxHeight: FEED_VIDEO_MAX_HEIGHT,
    transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), max-width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "width, height, max-width",
  } as React.CSSProperties;

  const actionRailLeft = `calc(50% + (${feedVideoFrameWidth} / 2) + 24px)`;
  const actionRailStyle = {
    left: actionRailLeft,
    top: isLandscape
      ? "50%"
      : `calc(50% + (${feedVideoFrameHeight} / 2))`,
    transform: isLandscape
      ? "translateY(-50%)"
      : "translateY(-100%) translateY(-16px)",
    transition: "left 280ms cubic-bezier(0.22, 1, 0.36, 1), top 280ms cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "left, top",
  } as React.CSSProperties;
  const collectionPanelStyle = {
    left:
      collectionPanelSide === "left"
        ? `max(12px, calc(${actionRailLeft} - ${COLLECTION_PANEL_WIDTH + COLLECTION_PANEL_GAP}px))`
        : `min(calc(100vw - ${COLLECTION_PANEL_WIDTH + 12}px), calc(${actionRailLeft} + ${COLLECTION_PANEL_RIGHT_GAP}px))`,
    top: "50%",
    transform: "translateY(-50%)",
    transition: "left 280ms cubic-bezier(0.22, 1, 0.36, 1)",
  } as React.CSSProperties;

  const resetPlaybackProgress = useCallback(() => {
    const player = videoRef.current;
    if (player) {
      player.pause();
      player.currentTime = 0;
    }

    lastProgressRef.current = 0;
    setProgress(0);
    setIsPlaying(false);
  }, []);
  const likes = formatCount(likeCount);
  const displayCaption = showTranslatedDescription && translatedDescription
    ? translatedDescription
    : caption;
  const shouldShowTranslationButton = Boolean(
    videoId && caption.trim() && !isTextLikelyLocale(caption, locale),
  );

  // keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    startTransition(() => {
      setTranslatedDescription(null);
      setShowTranslatedDescription(false);
    });
  }, [videoId, caption, locale]);

  useEffect(() => {
    if (!video?.id || !isNearViewport || !isPlaying) {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
      return;
    }

    const storageKey = `viewed_video_${video.id}`;
    if (sessionStorage.getItem(storageKey)) return;

    viewTimerRef.current = setTimeout(() => {
      sessionStorage.setItem(storageKey, "1");
      recordVideoView(video.id);
      viewTimerRef.current = null;
    }, 2000);

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [isNearViewport, isPlaying, recordVideoView, video?.id]);

  useEffect(() => {
    if (!isCollectionPanelOpen) return;

    let frameId = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateCollectionPanelSide);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (stageRef.current) resizeObserver.observe(stageRef.current);
    if (videoFrameRef.current) resizeObserver.observe(videoFrameRef.current);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
    };
  }, [isCollectionPanelOpen, updateCollectionPanelSide]);

  // ── Click-outside for options menu ──
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
        setSuppressOptionsHover(true);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptionsMenu, setShowOptionsMenu]);

  // ── Memory Management Observer (Near Viewport) ──
  useEffect(() => {
    const container = internalRef.current;
    if (!container) return;

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting);
      },
      { rootMargin: "800px 0px" } // Load video when within 800px of viewport
    );
    
    nearObserver.observe(container);
    return () => nearObserver.disconnect();
  }, []);

  // ── Video Playback & Visibility Observer ──
  useEffect(() => {
    if (!isNearViewport) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePipEnter = () => setIsPipActive(true);
    const handlePipLeave = () => setIsPipActive(false);
    videoEl.addEventListener("enterpictureinpicture", handlePipEnter);
    videoEl.addEventListener("leavepictureinpicture", handlePipLeave);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = !videoEl.paused;
        videoEl.pause();
      } else if (isIntersectingRef.current && wasPlayingBeforeHiddenRef.current) {
        videoRef.current?.play().catch(() => {});
      }
      if (!document.hidden) {
        wasPlayingBeforeHiddenRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (
            videoId &&
            video &&
            isCommentSidebarAvailable &&
            activeCommentVideoId !== null &&
            activeCommentVideoId !== videoId
          ) {
            openCommentSidebar(
              videoId,
              videoPath(video.username, video.id, { from: detailSource, comments: 1 }),
              video.allowComments ?? true,
            );
          }

          if (videoRef.current && !document.hidden) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else {
            setIsPlaying(true);
          }
        } else {
          resetPlaybackProgress();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(videoEl);

    return () => {
      videoEl.removeEventListener("enterpictureinpicture", handlePipEnter);
      videoEl.removeEventListener("leavepictureinpicture", handlePipLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, [
    activeCommentVideoId,
    detailSource,
    isCommentSidebarAvailable,
    isNearViewport,
    openCommentSidebar,
    resetPlaybackProgress,
    video,
    videoId,
  ]);

  useEffect(() => {
    if (isNearViewport) return;
    const frameId = requestAnimationFrame(resetPlaybackProgress);
    return () => cancelAnimationFrame(frameId);
  }, [isNearViewport, resetPlaybackProgress]);

  // ── Sync volume and muted from Redux ──
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.volume = volume;
      vid.muted = isMuted;
    }
  }, [volume, isMuted, isNearViewport]);

  // ── Cleanup control-icon timer on unmount ──
  useEffect(() => {
    return () => {
      if (controlIconTimerRef.current) clearTimeout(controlIconTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showFavoriteToast) return;

    const hideTimer = window.setTimeout(hideFavoriteToast, 5000);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!favoriteToastRef.current?.contains(target)) {
        hideFavoriteToast();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.clearTimeout(hideTimer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [hideFavoriteToast, showFavoriteToast]);

  // ──────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────

  /**
   * FIX 2 — debounced togglePlay.
   * Ignores rapid repeated taps within 300 ms to prevent lag/jitter.
   */
  const togglePlay = useCallback(() => {
    if (isPipActive || isTogglingRef.current) return;

    isTogglingRef.current = true;
    setTimeout(() => { isTogglingRef.current = false; }, 300);

    const vid = videoRef.current;
    if (!vid) return;

    if (isPlayingRef.current) {
      vid.pause();
      setIconType("pause");
    } else {
      vid.play().catch(() => {});
      setIconType("play");
    }
    setIsPlaying((prev) => !prev);

    setShowControlIcon(true);
    if (controlIconTimerRef.current) clearTimeout(controlIconTimerRef.current);
    controlIconTimerRef.current = setTimeout(() => setShowControlIcon(false), 600);
  }, [isPipActive]);

  const handleProfileClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (username) {
      router.push(`/@${username}`);
    }
  }, [router, username]);

  const handleCommentsClick = useCallback(() => {
    if (onCommentsClickProp) {
      onCommentsClickProp();
      return;
    }

    if (videoId && video && isCommentSidebarAvailable) {
      toggleCommentSidebar(
        videoId,
        videoPath(video.username, video.id, { from: detailSource, comments: 1 }),
        video.allowComments ?? true,
      );
    }
  }, [
    detailSource,
    isCommentSidebarAvailable,
    onCommentsClickProp,
    toggleCommentSidebar,
    video,
    videoId,
  ]);

  const debouncedLikeApi = useDebounceCallback((nextLiked: boolean, vidId: number, prevLiked: boolean, prevCount: number) => {
    const mutation = nextLiked ? likeMutation : unlikeMutation;
    mutation.mutate(vidId, {
      onSuccess: (response) => {
        if (response.data) {
          setIsLiked(response.data.liked);
          setLikeCount(response.data.likeCount);
        }
      },
      onError: () => {
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
      },
    });
  }, 300);

  const handleLike = () => {
    if (!video?.id || likeMutation.isPending || unlikeMutation.isPending) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    setIsLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    debouncedLikeApi(nextLiked, video.id, previousLiked, previousCount);
  };

  const handleSave = () => {
    if (!video?.id) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSaveCount((current) => Math.max(0, current + (nextSaved ? 1 : -1)));

    if (nextSaved) {
      saveMutation.mutate(video.id, {
        onSuccess: () => {
          setIsFavoriteToastLeaving(false);
          setShowFavoriteToast(true);
        },
        onError: () => {
          setIsSaved(false);
          setSaveCount((current) => Math.max(0, current - 1));
        },
      });
    } else {
      hideFavoriteToast();
      setIsCollectionPanelOpen(false);
      unsaveMutation.mutate(video.id, {
        onError: () => {
          setIsSaved(true);
          setSaveCount((current) => current + 1);
        },
      });
    }
  };

  const handleFollowAuthor = () => {
    const isFollowPending = followMutation.isPending || unfollowMutation.isPending;
    if (!video || isOwnVideo || isFollowPending) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }

    const previousFollowing = isFollowingAuthor;
    const nextFollowing = !previousFollowing;
    setFollowOverride({ videoId: video.id, value: nextFollowing });

    const mutation = nextFollowing ? followMutation : unfollowMutation;
    mutation.mutate(username, {
      onError: () => setFollowOverride({ videoId: video.id, value: previousFollowing }),
    });
  };

  const handleBlockUser = () => {
    if (!video || isOwnVideo) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }

    blockMutation.mutate(undefined, {
      onSuccess: () => {
        setShowOptionsMenu(false);
        closeMenu();
      },
    });
  };

  const exitPip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Exit PiP error:", error);
    }
  };

  /**
   * FIX 1 — throttled time update.
   * Only triggers a React re-render when progress changes by more than 0.5%,
   * cutting setState calls from ~60/s down to ~6/s for a typical video.
   */
  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const newProgress = (vid.currentTime / vid.duration) * 100;
    if (Math.abs(newProgress - lastProgressRef.current) > 0.5) {
      lastProgressRef.current = newProgress;
      setProgress(newProgress);
    }
  }, []);

  const handleEnded = () => {
    if (autoScroll) {
      const snap = videoRef.current?.closest('[style*="scroll-snap-align"]');
      snap?.nextElementSibling?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (vid && vid.duration) {
      const val = parseFloat(e.target.value);
      vid.currentTime = (val / 100) * vid.duration;
      lastProgressRef.current = val;
      setProgress(val);
      dispatch(setMuted(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    dispatch(setVolume(newVolume));
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  const handleTranslateDescription = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!videoId || !caption.trim() || translateDescriptionMutation.isPending) return;

    if (translatedDescription) {
      setShowTranslatedDescription((current) => !current);
      return;
    }

    translateDescriptionMutation.mutate(
      { videoId, targetLocale: locale },
      {
        onSuccess: (response) => {
          const translatedText = response.data?.translatedText?.trim();
          if (!translatedText) return;
          setTranslatedDescription(translatedText);
          setShowTranslatedDescription(true);
        },
      },
    );
  };

  const renderCaptionWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="font-bold hover:underline cursor-pointer text-white drop-shadow-md">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  return (
    <div
      ref={setRefs}
      data-feed-video-id={videoId}
      className="flex h-full w-full items-center justify-center px-4 py-4"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      <div
        ref={stageRef}
        className="relative flex h-full w-full items-center justify-center"
        style={{
          transform: `translateX(${resolvedStageOffsetX})`,
          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: resolvedStageOffsetX === "0px" ? undefined : "transform",
        }}
      >

        {/* ── Video wrapper ── */}
        <div
          ref={videoFrameRef}
          className={`
            relative group flex-shrink-0 bg-black
            overflow-hidden rounded-[20px] sm:rounded-[24px]
          `}
          style={videoFrameStyle}
        >
          {videoUrl ? (
            <>
              <div
                className="relative w-full h-full overflow-hidden rounded-[1rem] sm:rounded-[1rem] cursor-pointer"
                onClick={togglePlay}
                onContextMenu={openMenu}
                onMouseEnter={() => setSuppressOptionsHover(false)}
              >
                {isNearViewport ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="block h-full w-full object-cover"
                    loop={!autoScroll}
                    onEnded={handleEnded}
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(event) => {
                      const player = event.currentTarget;
                      if (player.videoWidth > 0 && player.videoHeight > 0) {
                        setDetectedAspectRatio(player.videoWidth / player.videoHeight);
                      }
                    }}
                    preload="metadata"
                    poster={video?.thumbnailUrl}
                    style={{ willChange: "transform" }}
                  />
                ) : (
                  <div className="w-full h-full relative">
                    {video?.thumbnailUrl ? (
                      <Image 
                        src={video.thumbnailUrl} 
                        alt={caption} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#121212]" />
                    )}
                  </div>
                )}

                {/* PiP Overlay */}
                {isPipActive && (
                  <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="p-4 bg-white/10 rounded-full mb-4">
                      <PictureInPicture className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-white font-bold text-lg mb-6">{t("pipActive")}</p>
                    <Button onClick={exitPip} size="md">
                      {t("back")}
                    </Button>
                  </div>
                )}

                {/* FIX 5 — Play/Pause flash: smoother ease-out scale */}
                <div
                  className={`
                    absolute inset-0 flex items-center justify-center
                    pointer-events-none z-50
                    transition-all duration-500 ease-out
                    ${showControlIcon
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.6]"}
                  `}
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                    {iconType === "play"
                      ? <Play  className="w-10 h-10 text-white fill-white ml-1" />
                      : <Pause className="w-10 h-10 text-white fill-white" />}
                  </div>
                </div>

                {/* Top gradient (hover) */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Volume control */}
                <div
                  className="absolute top-4 left-4 z-50 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch(toggleMuted()); }}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                  >
                    {isMuted || volume === 0
                      ? <VolumeX className="w-5 h-5" />
                      : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div
                    className={`
                      flex items-center bg-black/40
                      rounded-full p-3 ml-1
                      transition-all duration-300 origin-left
                      ${showVolumeSlider ? "w-32 opacity-100" : "w-0 opacity-0 overflow-hidden"}
                    `}
                  >
                    <input
                      type="range" min="0" max="1" step="0.1" value={volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>

                {/* Mobile overlay interaction buttons */}
                <div className="absolute right-2 bottom-24 sm:hidden flex flex-col items-center gap-2 z-40">
                  <InteractionSidebar
                    overlay
                    avatarUrl={avatarUrl}
                    username={username}
                    isLiked={isLiked}
                    isSaved={isSaved}
                    likes={likes}
                    comments={comments}
                    saves={formatCount(saveCount)}
                    shares={shares}
                    onLike={handleLike}
                    onSave={handleSave}
                    onShare={() => setIsShareModalOpen(true)}
                    onAvatarClick={handleProfileClick}
                    onCommentsClick={handleCommentsClick}
                    showFollowButton={!isOwnVideo}
                    isFollowingAuthor={isFollowingAuthor}
                    isFollowPending={followMutation.isPending || unfollowMutation.isPending}
                    onFollowClick={handleFollowAuthor}
                    musicLabel={soundLabel ?? "Âm thanh"}
                    soundId={video?.sound?.id}
                    soundCoverUrl={video?.sound?.coverUrl ?? video?.sound?.owner?.avatarUrl ?? null}
                    videoRef={videoRef}
                  />
                </div>

                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

                {/* Caption / username area with better typography */}
                <div className="absolute bottom-5 left-3 right-20 sm:right-4 z-0 text-white select-none pointer-events-none">
                  <RepostBadge
                    users={repostUsers}
                    onRepost={canRepost && !isReposted ? handleRepost : undefined}
                    onRemove={canRepost && isReposted ? handleRemoveRepost : undefined}
                    className="mb-1.5"
                    popoverPlacement="top"
                  />
                  <div 
                    className="flex items-center gap-2 mb-1.5 pointer-events-auto group/user cursor-pointer w-fit"
                    onClick={handleProfileClick}
                  >
                    <div className="relative sm:hidden rounded-full p-[1.5px] bg-white/20 shadow-xl backdrop-blur-sm">
                      <Avatar src={avatarUrl} alt={username} size="md" showBorder={false} />
                    </div>
                    <h3 className="font-bold text-[16px] sm:text-[19px] hover:underline drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                      {userNickname ? `${userNickname}` : `@${username}`}
                    </h3>
                  </div>
                  
                  <p className="text-[14px] sm:text-[15px] line-clamp-3 leading-relaxed opacity-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] font-medium max-w-[420px]">
                    {renderCaptionWithHashtags(displayCaption)}
                  </p>

                  
                  {shouldShowTranslationButton ? (
                    <div className="mt-2 pointer-events-auto flex items-center gap-4">
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={handleTranslateDescription}
                        disabled={translateDescriptionMutation.isPending}
                        className="text-[12px] font-bold opacity-70 hover:opacity-100 transition-opacity bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm disabled:cursor-wait disabled:opacity-50"
                      >
                        {translateDescriptionMutation.isPending
                          ? t("translating")
                          : showTranslatedDescription
                            ? t("showOriginal")
                            : t("seeTranslation")}
                      </button>
                    </div>
                  ) : null}
                  
                </div>
              </div>

              {/* Options Menu */}
              <div
                className={`absolute top-4 right-4 z-[100] transition-opacity duration-300 ${
                  showOptionsMenu
                    ? "opacity-100"
                    : suppressOptionsHover
                      ? "opacity-0"
                      : "opacity-0 group-hover:opacity-100"
                }`}
                ref={menuRef}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSuppressOptionsHover(false);
                    setShowOptionsMenu((p) => !p);
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
                {showOptionsMenu && (
                  <VideoOptionsMenu
                    onClose={() => setShowOptionsMenu(false)}
                    videoRef={videoRef}
                    videoId={video?.id}
                    username={username}
                    description={caption}
                    thumbnailUrl={video?.thumbnailUrl}
                    isLiked={isLiked}
                    isSaved={isSaved}
                    canNotInterested={Boolean(video && !isOwnVideo)}
                    canBlock={Boolean(video && !isOwnVideo)}
                    onReportClick={() => setIsReportOpen(true)}
                    onBlockClick={handleBlockUser}
                    onNotInterested={handleNotInterested}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              className="bg-[#121212] w-full h-full rounded-[24px] sm:rounded-[32px] flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
            </div>
          )}

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 w-full h-6 z-50 group/progress"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute bottom-0 left-0 w-full h-1 group-hover/progress:h-1.5 transition-all duration-150 bg-white/10 rounded-b-[32px] overflow-hidden">
              <div
                className="h-full bg-brand transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div
              className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150 shadow-[0_0_8px_rgba(255,255,255,0.6)] z-[60]"
              style={{ bottom: "-1px", left: `calc(${progress}% - 6px)` }}
            />
            <input
              type="range" min="0" max="100" value={progress}
              onChange={handleSeek}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[70]"
            />
          </div>
        </div>

        {/* Tablet/Desktop interaction sidebar */}
        <div className="absolute hidden sm:block" style={actionRailStyle}>
          <InteractionSidebar
            avatarUrl={avatarUrl}
            username={username}
            isLiked={isLiked}
            isSaved={isSaved}
            likes={likes}
            comments={comments}
            saves={formatCount(saveCount)}
            shares={shares}
            onLike={handleLike}
            onSave={handleSave}
            onShare={() => setIsShareModalOpen(true)}
            onAvatarClick={handleProfileClick}
            onCommentsClick={handleCommentsClick}
            showFollowButton={!isOwnVideo}
            isFollowingAuthor={isFollowingAuthor}
            isFollowPending={followMutation.isPending || unfollowMutation.isPending}
            onFollowClick={handleFollowAuthor}
            musicLabel={soundLabel ?? "Âm thanh"}
            soundId={video?.sound?.id}
            soundCoverUrl={video?.sound?.coverUrl ?? video?.sound?.owner?.avatarUrl ?? null}
            videoRef={videoRef}
          />
        </div>

        {video?.id && (
          <CollectionManagePanel
            isOpen={isCollectionPanelOpen}
            videoId={video.id}
            panelStyle={collectionPanelStyle}
            onClose={() => setIsCollectionPanelOpen(false)}
          />
        )}

        {showFavoriteToast && isSaved && (
          <div
            ref={favoriteToastRef}
            className={`absolute bottom-3 left-1/2 z-[210] flex h-14 items-center gap-3 rounded-lg bg-[#3b3b3b] px-5 text-white shadow-xl transition-all duration-200 ease-out ${
              isFavoriteToastLeaving
                ? "-translate-x-1/2 translate-y-8 opacity-0"
                : "-translate-x-1/2 translate-y-0 opacity-100"
            }`}
          >
            <Check className="size-5 rounded-full bg-white text-[#3b3b3b]" />
            <span className="text-[15px] font-bold">{tCollection("savedToFavorites")}</span>
            <button
              type="button"
              onClick={() => {
                hideFavoriteToast();
                setIsCollectionPanelOpen(true);
              }}
              className="ml-3 text-[15px] font-bold text-[#8ab4ff] hover:underline"
            >
              {tCollection("manage")} &gt;
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {video?.id && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="VIDEO"
          targetId={video.id}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onCopyLink={handleCopyLink}
        isReposted={isReposted}
        onRepost={handleRepost}
        onRemoveRepost={handleRemoveRepost}
        showRepost={canRepost}
        videoId={video?.id}
      />

      {/* Repost Toast */}
      {showRepostToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 rounded-full bg-[#222] px-4 py-2.5 text-[14px] font-semibold text-white shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <Repeat2 className="size-4 text-yellow-400" />
          {t('reposted')}
        </div>
      )}

      {copyToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 rounded-full bg-[#222] px-4 py-2.5 text-[14px] font-semibold text-white shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {copyToast === "success" ? (
            <CheckCircle className="size-4 text-green-400" />
          ) : (
            <AlertCircle className="size-4 text-brand" />
          )}
          {copyToast === "success" ? tCommon("copyLinkSuccess") : tCommon("copyLinkError")}
        </div>
      )}

      {/* Context Menu */}
      <VideoContextMenu 
        isOpen={isCtxOpen}
        position={ctxPos}
        onCopyLink={handleCopyLink}
        onDownload={handleDownload}
        onSendToFriends={() => closeMenu()}
        onViewDetails={() => {
            closeMenu();
            if (video) router.push(videoPath(video.username, video.id, { from: detailSource }));
        }}
        onNotInterested={!isOwnVideo ? handleNotInterested : undefined}
      />
    </div>
  );
}
