"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useLikeVideoMutation,
  useAllVideos,
  useLikedVideos,
  useUnlikeVideoMutation,
  useRepostVideoMutation,
  useUnrepostVideoMutation,
  useUserRepostedVideos,
  useUserVideos,
  useVideoDetail,
} from "@/hooks/video-hooks";
import { useFriendsFeed } from "@/hooks/friend-hooks";
import { useFollowingFeed } from "@/hooks/following-hooks";
import { useSearchVideos } from "@/hooks/search-hooks";
import {
  useBlockUserMutation,
  useDynamicFollowMutation,
  useDynamicUnfollowMutation,
} from "@/hooks/user-hooks";
import {
  usePublicCollectionVideos,
  useFavoriteVideos,
  useSaveVideoMutation,
  useUnsaveVideoMutation,
} from "@/hooks/collection-hooks";
import { VideoPlayerContainer } from "./VideoPlayerContainer";
import CommentSection from "@/components/video/CommentSection";
import VideoCard from "@/components/video/VideoCard";
import { RepostBadge } from "@/components/video/RepostBadge";
import { DocumentTitle, truncateTitle } from "@/components/shared/DocumentTitle";
import {
  ChevronLeft,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Bookmark,
  X,
  ChevronUp,
  ChevronDown,
  Repeat2,
  Copy,
  Play,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCount } from "@/utils/format-count";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import type { Video } from "@/types/video";
import type { VideoRepostUser } from "@/types/video";
import type { SearchVideo } from "@/types/search";
import { useTranslations } from "next-intl";
import { videoPath } from "@/utils/video-url";


type DetailMode = "direct" | "internal";
type DetailTab = "comments" | "videos";
const DIRECT_DETAIL_SOURCES = new Set(["feed", "friends", "following", "follow"]);
const PROFILE_DETAIL_SOURCES = new Set(["profile", "collection", "favorites", "liked", "reposts", "explore", "chat"]);
const FEED_DETAIL_PANEL_WIDTH = 384;
const DIRECT_DETAIL_PANEL_WIDTH = 420;

function toSearchVideoDetail(video: SearchVideo): Video {
  return {
    id: video.id,
    title: video.caption,
    description: video.caption,
    thumbnailUrl: video.coverUrl ?? undefined,
    fileUrl: video.videoUrl ?? "",
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    userId: video.author.id,
    username: video.author.username,
    userNickname: video.author.displayName,
    userAvatarUrl: video.author.avatarUrl ?? undefined,
    createdAt: video.createdAt,
    isFollowingAuthor: video.author.followed,
  };
}

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const t = useTranslations("video");

  const rawUsername = params.username as string;
  const videoIdStr = params.videoId as string;
  const videoId = Number(videoIdStr);
  const decodedUsername = decodeURIComponent(rawUsername);
  const username = decodedUsername.startsWith("@")
    ? decodedUsername.substring(1)
    : decodedUsername;

  const source = searchParams.get("from");
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const collectionIdParam = searchParams.get("collectionId");
  const collectionId = collectionIdParam ? Number(collectionIdParam) : undefined;
  const collectionOwner = searchParams.get("collectionOwner") ?? username;
  const profileOwner = searchParams.get("profileOwner") ?? username;
  const detailMode: DetailMode = !source || DIRECT_DETAIL_SOURCES.has(source) ? "direct" : "internal";
  const isProfileDetail = source === "profile";
  const isCollectionDetail = source === "collection" && Number.isFinite(collectionId) && Number(collectionId) > 0;
  const usesProfileDetailLayout = isProfileDetail || PROFILE_DETAIL_SOURCES.has(source ?? "");
  const usesFeedThemeDetail = !source || source === "feed";
  const isScrollableDetail = true;
  const commentsRequested = searchParams.get("comments") === "1";
  const defaultTab: DetailTab = commentsRequested ? "comments" : detailMode === "direct" ? "videos" : "comments";
  const activeTabKey = `${videoId}:${defaultTab}`;

  const { data: videoRes, isLoading, isError } = useVideoDetail(username, videoId);
  const video = videoRes?.data;
  const { data: allVideosRes } = useAllVideos();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTabState, setActiveTabState] = useState<{ key: string; tab: DetailTab }>(() => ({
    key: activeTabKey,
    tab: defaultTab,
  }));
  const activeTab = activeTabState.key === activeTabKey ? activeTabState.tab : defaultTab;
  const setActiveTab = useCallback(
    (tab: DetailTab) => setActiveTabState({ key: activeTabKey, tab }),
    [activeTabKey],
  );
  const [optimisticVideo, setOptimisticVideo] = useState<Video | null>(null);
  const [activeScrollableVideo, setActiveScrollableVideo] = useState<Video | null>(null);
  const [followOverride, setFollowOverride] = useState<{ userId: number; value: boolean } | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [repostOverride, setRepostOverride] = useState<{ videoId: number; value: boolean } | null>(null);
  const [showRepostToast, setShowRepostToast] = useState(false);
  const initializedScrollableVideoIdRef = useRef<number | null>(null);
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  const displayedVideo = optimisticVideo ?? activeScrollableVideo ?? video;
  const { data: moreVideosRes } = useUserVideos(displayedVideo?.userId);
  const likeMutation = useLikeVideoMutation();
  const unlikeMutation = useUnlikeVideoMutation();
  const repostMutation = useRepostVideoMutation();
  const unrepostMutation = useUnrepostVideoMutation();
  const saveMutation = useSaveVideoMutation();
  const unsaveMutation = useUnsaveVideoMutation();
  const followMutation = useDynamicFollowMutation();
  const unfollowMutation = useDynamicUnfollowMutation();
  const blockMutation = useBlockUserMutation(displayedVideo?.username ?? username);
  const { data: collectionVideosRes } = usePublicCollectionVideos(
    collectionOwner,
    collectionId,
    isCollectionDetail,
    0,
    18,
  );
  const { data: favoriteVideosRes } = useFavoriteVideos(source === "favorites");
  const { data: likedVideosRes } = useLikedVideos(source === "liked");
  const { data: repostedVideosRes } = useUserRepostedVideos(profileOwner, source === "reposts");
  const { data: followingFeedRes } = useFollowingFeed(
    Boolean(currentUser) && (source === "following" || source === "follow"),
    30,
  );
  const { data: friendsFeedRes } = useFriendsFeed(Boolean(currentUser) && source === "friends", 30);
  const { data: searchVideosRes } = useSearchVideos(searchQuery, 0, 50, source === "search" && searchQuery.length > 0);
  const moreVideos = useMemo(
    () => moreVideosRes?.data?.filter((item) => item.id !== displayedVideo?.id) ?? [],
    [displayedVideo?.id, moreVideosRes?.data],
  );
  const detailScopeParams = useMemo(() => {
    if (source === "search") return { from: "search", q: searchQuery || undefined };
    if (source === "reposts") return { from: "reposts", profileOwner };
    if (source !== "collection") return { from: source ?? "feed" };

    return {
      from: "collection",
      collectionId: isCollectionDetail ? collectionId : undefined,
      collectionOwner,
    };
  }, [collectionId, collectionOwner, isCollectionDetail, profileOwner, searchQuery, source]);
  const scrollableVideos = useMemo(() => {
    let videos: Video[] = [];

    if (source === "profile") {
      videos = moreVideosRes?.data ?? [];
    } else if (source === "following" || source === "follow") {
      videos = followingFeedRes?.pages.flatMap((page) => page.data ?? []) ?? [];
    } else if (source === "friends") {
      videos = friendsFeedRes?.pages.flatMap((page) => page.data ?? []) ?? [];
    } else if (source === "search") {
      videos = (searchVideosRes?.data ?? [])
        .map(toSearchVideoDetail)
        .filter((item) => item.fileUrl && !item.unavailable && !item.deleted);
    } else if (source === "collection") {
      videos = (collectionVideosRes?.data ?? []).filter((item) => !item.unavailable && !item.deleted);
    } else if (source === "favorites") {
      videos = (favoriteVideosRes?.data ?? []).filter((item) => !item.unavailable && !item.deleted);
    } else if (source === "liked") {
      videos = (likedVideosRes?.data ?? []).filter((item) => !item.unavailable && !item.deleted);
    } else if (source === "reposts") {
      videos = (repostedVideosRes?.data ?? []).filter((item) => !item.unavailable && !item.deleted);
    } else if (source === "chat") {
      // The user wants: "nếu tôi xem video dưới cùng thì tôi lướt lên sẽ là video gửi gần nhất rồi lên dần"
      // This means the array should be [newest, older, oldest].
      const convIdStr = searchParams.get("conversationId");
      if (convIdStr) {
        // We use allVideosRes as a soft data source to resolve full Video objects from IDs
        const chatVideoIdsStr = searchParams.get("chatVideos");
        if (chatVideoIdsStr) {
           const ids = chatVideoIdsStr.split(",").map(Number);
           videos = ids.map(id => allVideosRes?.data?.find(v => v.id === id)).filter(Boolean) as Video[];
        } else {
           videos = allVideosRes?.data ?? [];
        }
      } else {
        videos = allVideosRes?.data ?? [];
      }
    } else {
      videos = allVideosRes?.data ?? [];
    }

    if (!video) return videos;

    if (videos.some((item) => item.id === video.id)) return videos;
    return [video, ...videos];
  }, [
    allVideosRes?.data,
    collectionVideosRes?.data,
    favoriteVideosRes?.data,
    followingFeedRes?.pages,
    friendsFeedRes?.pages,
    likedVideosRes?.data,
    moreVideosRes?.data,
    repostedVideosRes?.data,
    searchVideosRes?.data,
    source,
    video,
  ]);
  const canBlockAuthor = Boolean(currentUser && displayedVideo && currentUser.id !== displayedVideo.userId);
  const canFollowAuthor = Boolean(currentUser && displayedVideo && currentUser.id !== displayedVideo.userId);
  const isReposted =
    displayedVideo?.id && repostOverride?.videoId === displayedVideo.id
      ? repostOverride.value
      : (displayedVideo?.isReposted ?? false);
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
    const users = [...(displayedVideo?.repostedBy ?? [])];
    const hasCurrentUser = currentRepostUser && users.some((user) => user.id === currentRepostUser.id);
    if (isReposted && currentRepostUser && !hasCurrentUser) {
      return [currentRepostUser, ...users];
    }
    return users;
  })();
  const isFollowingAuthor =
    displayedVideo?.userId && followOverride?.userId === displayedVideo.userId
      ? followOverride.value
      : (displayedVideo?.isFollowingAuthor ?? false);
  const canonicalPath = displayedVideo ? videoPath(displayedVideo.username, displayedVideo.id) : "";
  const shareUrl = typeof window !== "undefined" && canonicalPath ? `${window.location.origin}${canonicalPath}` : "";
  const documentTitle = displayedVideo
    ? `${truncateTitle(displayedVideo.description || displayedVideo.title || `${displayedVideo.userNickname || displayedVideo.username}'s video`)} | TopTop`
    : "TopTop - Make Your Day";

  useEffect(() => {
    if (!isScrollableDetail || !video) return;
    if (initializedScrollableVideoIdRef.current === video.id) return;

    initializedScrollableVideoIdRef.current = video.id;
    setActiveScrollableVideo(video);
    setOptimisticVideo(null);
  }, [isScrollableDetail, video]);

  useEffect(() => {
    if (!isScrollableDetail || !video || scrollableVideos.length === 0 || usesProfileDetailLayout) return;
    if (initializedScrollableVideoIdRef.current !== video.id) return;

    const frameId = requestAnimationFrame(() => {
      const target = scrollableContainerRef.current?.querySelector(
        `[data-detail-video-id="${video.id}"]`,
      );
      target?.scrollIntoView({ block: "start" });
    });

    return () => cancelAnimationFrame(frameId);
  }, [isScrollableDetail, scrollableVideos.length, video, usesProfileDetailLayout]);



  const requireLogin = () => {
    if (currentUser) return true;
    dispatch(openAuthModal("login"));
    return false;
  };

  const handleLike = () => {
    if (!displayedVideo || !requireLogin()) return;
    const previousVideo = displayedVideo;
    if (displayedVideo.isLiked) {
      setOptimisticVideo({
        ...displayedVideo,
        isLiked: false,
        likeCount: Math.max(0, displayedVideo.likeCount - 1),
      });
      unlikeMutation.mutate(displayedVideo.id, {
        onSuccess: (response) => {
          const stats = response.data;
          if (!stats) return;
          setOptimisticVideo((current) => ({
            ...(current ?? previousVideo),
            isLiked: stats.liked,
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            saveCount: stats.saveCount,
            shareCount: stats.shareCount,
          }));
        },
        onError: () => setOptimisticVideo(previousVideo),
      });
    } else {
      setOptimisticVideo({
        ...displayedVideo,
        isLiked: true,
        likeCount: displayedVideo.likeCount + 1,
      });
      likeMutation.mutate(displayedVideo.id, {
        onSuccess: (response) => {
          const stats = response.data;
          if (!stats) return;
          setOptimisticVideo((current) => ({
            ...(current ?? previousVideo),
            isLiked: stats.liked,
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            saveCount: stats.saveCount,
            shareCount: stats.shareCount,
          }));
        },
        onError: () => setOptimisticVideo(previousVideo),
      });
    }
  };

  const handleSave = () => {
    if (!displayedVideo || !requireLogin()) return;

    const previousVideo = displayedVideo;
    const nextSaved = !displayedVideo.isSaved;
    setOptimisticVideo({
      ...displayedVideo,
      isSaved: nextSaved,
      saveCount: Math.max(0, (displayedVideo.saveCount ?? 0) + (nextSaved ? 1 : -1)),
    });

    const mutation = nextSaved ? saveMutation : unsaveMutation;
    mutation.mutate(displayedVideo.id, {
      onSuccess: (response) => {
        const savedVideo = response.data;
        if (!savedVideo) return;
        setOptimisticVideo((current) => {
          const baseVideo = current ?? previousVideo;
          return {
            ...baseVideo,
            ...savedVideo,
            isLiked: savedVideo.isLiked ?? baseVideo.isLiked,
            isSaved: savedVideo.isSaved ?? nextSaved,
            saveCount: savedVideo.saveCount ?? baseVideo.saveCount,
          };
        });
      },
      onError: () => setOptimisticVideo(previousVideo),
    });
  };

  const handleBlockUser = () => {
    if (!displayedVideo || !requireLogin()) return;

    blockMutation.mutate(undefined, {
      onSuccess: () => setIsUnavailable(true),
    });
  };

  const handleToggleFollowAuthor = () => {
    if (!displayedVideo || !canFollowAuthor) return;
    if (!requireLogin()) return;
    if (followMutation.isPending || unfollowMutation.isPending) return;

    const previousFollowing = isFollowingAuthor;
    const nextFollowing = !previousFollowing;
    setFollowOverride({ userId: displayedVideo.userId, value: nextFollowing });

    const mutation = nextFollowing ? followMutation : unfollowMutation;
    mutation.mutate(displayedVideo.username, {
      onError: () => setFollowOverride({ userId: displayedVideo.userId, value: previousFollowing }),
    });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleRepost = () => {
    if (!displayedVideo) return;
    if (!requireLogin()) return;
    if (repostMutation.isPending || unrepostMutation.isPending) return;

    const previousReposted = isReposted;
    setRepostOverride({ videoId: displayedVideo.id, value: true });
    setShowRepostToast(true);
    setTimeout(() => setShowRepostToast(false), 2500);

    repostMutation.mutate(displayedVideo.id, {
      onSuccess: (response) => {
        if (response.data?.reposted !== undefined) {
          setRepostOverride({ videoId: displayedVideo.id, value: response.data.reposted });
        }
      },
      onError: () => {
        setRepostOverride({ videoId: displayedVideo.id, value: previousReposted });
        setShowRepostToast(false);
      },
    });
  };

  const handleRemoveRepost = () => {
    if (!displayedVideo) return;
    if (repostMutation.isPending || unrepostMutation.isPending) return;

    const previousReposted = isReposted;
    setRepostOverride({ videoId: displayedVideo.id, value: false });
    setShowRepostToast(false);

    unrepostMutation.mutate(displayedVideo.id, {
      onSuccess: (response) => {
        if (response.data?.reposted !== undefined) {
          setRepostOverride({ videoId: displayedVideo.id, value: response.data.reposted });
        }
      },
      onError: () => setRepostOverride({ videoId: displayedVideo.id, value: previousReposted }),
    });
  };

  const handleCopyVideoLink = async (targetVideo: Video) => {
    const targetUrl = `${window.location.origin}${videoPath(targetVideo.username, targetVideo.id)}`;
    await navigator.clipboard.writeText(targetUrl);
  };

  const handleScrollableVideoActive = useCallback((nextVideo: Video) => {
    setActiveScrollableVideo((current) => {
      if (current?.id === nextVideo.id) return current;
      return nextVideo;
    });
    setOptimisticVideo(null);

    if (typeof window !== "undefined") {
      window.history.replaceState(
        window.history.state,
        "",
        videoPath(nextVideo.username, nextVideo.id, detailScopeParams),
      );
    }
  }, [detailScopeParams]);

  const navigateToVideo = useCallback((direction: 1 | -1) => {
    if (scrollableVideos.length === 0 || !displayedVideo) return;
    const currentIndex = scrollableVideos.findIndex((v) => v.id === displayedVideo.id);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < scrollableVideos.length) {
      handleScrollableVideoActive(scrollableVideos[nextIndex]);
    }
  }, [scrollableVideos, displayedVideo, handleScrollableVideoActive]);

  useEffect(() => {
    if (!usesProfileDetailLayout) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateToVideo(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateToVideo(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [usesProfileDetailLayout, navigateToVideo]);

  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVideoAreaWheel = (e: React.WheelEvent) => {
    if (!usesProfileDetailLayout) return;
    
    if (wheelTimeoutRef.current) return; // Cooldown active

    if (e.deltaY > 30) {
      navigateToVideo(1);
      wheelTimeoutRef.current = setTimeout(() => { wheelTimeoutRef.current = null; }, 800);
    } else if (e.deltaY < -30) {
      navigateToVideo(-1);
      wheelTimeoutRef.current = setTimeout(() => { wheelTimeoutRef.current = null; }, 800);
    }
  };

  useEffect(() => {
    if ((isUnavailable || isError || (!isLoading && !videoRes?.data)) && source === "chat") {
      const convId = searchParams.get("conversationId");
      if (convId) {
        router.replace(`/messages?conversation=${convId}`);
      } else {
        router.replace("/messages");
      }
    }
  }, [isUnavailable, isError, isLoading, videoRes, source, router, searchParams]);

  if (Number.isNaN(videoId)) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        ID video không hợp lệ.
      </div>
    );
  }

  if (isLoading) {
    return <VideoDetailSkeleton mode={detailMode} />;
  }

  if (isUnavailable || isError || !displayedVideo) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-white">
        <DocumentTitle title="Video unavailable | TopTop" />
        <h1 className="mb-4 text-2xl font-bold">{t("videoUnavailable")}</h1>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand hover:underline"
        >
          <ChevronLeft size={20} />
          Quay lại
        </button>
      </div>
    );
  }

  const commonPlayerProps = {
    video: displayedVideo,
    onCopyLink: handleCopyLink,
    onOpenSendModal: () => {},
    onOpenVideoInfo: () => {},
    onBlockUser: canBlockAuthor ? handleBlockUser : undefined,
    blockLabel: `${t("blockUser")} @${displayedVideo.username}`,
  };

  if (detailMode === "direct") {
    return (
      <div className="relative flex h-full w-full overflow-hidden bg-background">
        <DocumentTitle title={documentTitle} />
        <div
          className={`relative flex min-w-0 flex-1 items-center justify-center ${
            usesFeedThemeDetail ? "bg-background" : "bg-black"
          }`}
        >
          <div
            ref={scrollableContainerRef}
            className="h-full w-full overflow-y-auto custom-scrollbar"
            style={{
              scrollSnapType: "y mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {scrollableVideos.map((scrollVideo) => (
              <ScrollableFeedDetailVideo
                key={scrollVideo.id}
                video={scrollVideo}
                detailSource={source ?? "feed"}
                isInitial={scrollVideo.id === Number(params.videoId)}
                onActive={handleScrollableVideoActive}
                onCommentsClick={() => setActiveTab("comments")}
                stageOffsetX={usesFeedThemeDetail ? "clamp(-80px, -4vw, -48px)" : "0px"}
              />
            ))}
          </div>
        </div>

        <aside
          className={`hidden flex-shrink-0 flex-col border-l bg-background lg:flex ${
            usesFeedThemeDetail ? "border-elevated" : "border-white/10"
          }`}
          style={{ width: usesFeedThemeDetail ? FEED_DETAIL_PANEL_WIDTH : DIRECT_DETAIL_PANEL_WIDTH }}
        >
          <div className="h-24" />

          <div
            className={`flex border-b px-6 ${
              usesFeedThemeDetail ? "border-elevated" : "border-white/10"
            }`}
          >
            <DetailTabButton
              active={activeTab === "comments"}
              onClick={() => setActiveTab("comments")}
              label="Bình luận"
            />
            <DetailTabButton
              active={activeTab === "videos"}
              onClick={() => setActiveTab("videos")}
              label="Bạn có thể thích"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "comments" ? (
              <CommentSection
                key={displayedVideo.id}
                videoId={displayedVideo.id}
                allowComments={displayedVideo.allowComments ?? true}
                embedded
                showHeader={false}
                className="border-0"
              />
            ) : (
              <RecommendedVideoGrid videos={moreVideos} />
            )}
          </div>
        </aside>

      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[#111] text-white animate-in fade-in duration-200">
      <DocumentTitle title={documentTitle} />
      <button
        onClick={() => router.back()}
        className="absolute left-6 top-6 z-[120] grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={30} />
      </button>

      <div 
        className={`relative min-w-0 flex-1 ${usesProfileDetailLayout ? "bg-black" : "bg-[#161616]"}`}
        onWheel={usesProfileDetailLayout ? handleVideoAreaWheel : undefined}
      >
        {usesProfileDetailLayout ? (
          <div className="relative h-full w-full">
            <VideoPlayerContainer
              {...commonPlayerProps}
              controlsVariant="profile-detail"
              className="h-full w-full p-0"
              isActive={true}
            />
            {/* Floating Navigation Buttons */}
            <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-4 z-50">
              <button
                onClick={() => navigateToVideo(-1)}
                disabled={scrollableVideos.findIndex((v) => v.id === displayedVideo?.id) <= 0}
                className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition"
                aria-label="Video trước"
              >
                <ChevronUp size={24} />
              </button>

              <button
                onClick={() => navigateToVideo(1)}
                disabled={scrollableVideos.findIndex((v) => v.id === displayedVideo?.id) >= scrollableVideos.length - 1}
                className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition"
                aria-label="Video tiếp theo"
              >
                <ChevronDown size={24} />
              </button>
            </div>
          </div>
        ) : isScrollableDetail && scrollableVideos.length > 0 ? (
          <div
            ref={scrollableContainerRef}
            className="h-full overflow-y-auto custom-scrollbar"
            style={{
              scrollSnapType: "y mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {scrollableVideos.map((scrollVideo) => (
              <ScrollableDetailVideo
                key={scrollVideo.id}
                video={scrollVideo}
                isActive={displayedVideo?.id === scrollVideo.id}
                isInitial={scrollVideo.id === Number(params.videoId)}
                controlsVariant="default"
                className="h-full w-full px-8 py-0"
                onActive={handleScrollableVideoActive}
                onCopyLink={() => handleCopyVideoLink(scrollVideo)}
                onBlockUser={
                  currentUser?.id && currentUser.id !== scrollVideo.userId
                    ? handleBlockUser
                    : undefined
                }
                blockLabel={`${t("blockUser")} @${scrollVideo.username}`}
              />
            ))}
          </div>
        ) : (
          <VideoPlayerContainer
            {...commonPlayerProps}
            controlsVariant="default"
            className="h-full w-full px-8 py-0"
            isActive={true}
          />
        )}
        {!usesProfileDetailLayout && (
          <RepostBadge
            users={repostUsers}
            onRepost={!isReposted ? handleRepost : undefined}
            onRemove={isReposted ? handleRemoveRepost : undefined}
            className="absolute bottom-10 left-12 z-[95]"
            popoverPlacement="top"
          />
        )}
      </div>

      <aside
        className={`hidden flex-shrink-0 flex-col border-l border-white/10 bg-background xl:flex ${
          usesProfileDetailLayout ? "w-[34vw] min-w-[420px] max-w-[560px]" : "w-[520px]"
        }`}
      >
        <div className="border-b border-white/10 p-5">
          <div className="mb-4 rounded-xl bg-elevated/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <Link href={`/@${displayedVideo.username}`} className="flex min-w-0 items-center gap-3">
                <div className="relative size-11 overflow-hidden rounded-full bg-surface">
                  <Image
                    src={displayedVideo.userAvatarUrl || "/default-avatar.png"}
                    alt={displayedVideo.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-[18px] font-bold">@{displayedVideo.username}</h3>
                  <p className="truncate text-[13px] font-semibold text-text-secondary">
                    {displayedVideo.userNickname || displayedVideo.username}
                    {" · "}
                    {new Date(displayedVideo.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </Link>
              {canFollowAuthor && (
                <button
                  type="button"
                  onClick={handleToggleFollowAuthor}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`h-10 min-w-[104px] rounded-sm px-5 text-[16px] font-bold transition ${
                    isFollowingAuthor
                      ? "bg-elevated text-white hover:bg-hover"
                      : "bg-brand text-white hover:bg-brand-dark"
                  } ${(followMutation.isPending || unfollowMutation.isPending) ? "opacity-60" : ""}`}
                >
                  {isFollowingAuthor ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-snug">
              {displayedVideo.description || displayedVideo.title}
            </p>
            <p className="mt-2.5 text-[13px] font-semibold text-text-secondary">
              ♫ {t("originalSound", { username: displayedVideo.username })}
            </p>
            <RepostBadge
              users={repostUsers}
              onRepost={!isReposted ? handleRepost : undefined}
              onRemove={isReposted ? handleRemoveRepost : undefined}
              showRemoveButton={!usesProfileDetailLayout}
              className="mt-3"
              popoverPlacement="bottom"
            />
          </div>

          <div className="mb-4 flex items-center gap-3">
            <CompactMetric
              active={displayedVideo.isLiked}
              icon={<Heart className={displayedVideo.isLiked ? "fill-current" : ""} size={20} />}
              label={formatCount(displayedVideo.likeCount)}
              onClick={handleLike}
            />
            <CompactMetric
              icon={<MessageCircle size={20} />}
              label={formatCount(displayedVideo.commentCount)}
              onClick={() => setActiveTab("comments")}
            />
            <CompactMetric
              active={displayedVideo.isSaved}
              activeColor="text-yellow-400"
              icon={<Bookmark className={displayedVideo.isSaved ? "fill-current" : ""} size={20} />}
              label={formatCount(displayedVideo.saveCount ?? 0)}
              onClick={handleSave}
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={isReposted ? handleRemoveRepost : handleRepost}
                className={`grid size-8 place-items-center rounded-full transition ${
                  isReposted ? "bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25" : "bg-elevated text-yellow-400 hover:bg-hover"
                }`}
                title={isReposted ? "Xóa video đăng lại" : "Đăng lại"}
              >
                <Repeat2 size={16} />
              </button>
              <ShareCircle icon={<LinkIcon size={16} />} onClick={handleCopyLink} />
            </div>
          </div>

          <div className="flex h-9 overflow-hidden rounded-md bg-elevated">
            <div className="min-w-0 flex-1 truncate px-3 py-2 text-[14px] text-text-secondary">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-hover px-4 text-[14px] font-bold hover:bg-white/15"
            >
              <Copy className="size-3.5" />
              Sao chép liên kết
            </button>
          </div>
        </div>

        <div className="flex border-b border-white/10 px-8">
          <DetailTabButton
            active={activeTab === "comments"}
            onClick={() => setActiveTab("comments")}
            label={`Bình luận (${formatCount(displayedVideo.commentCount)})`}
          />
          <DetailTabButton
            active={activeTab === "videos"}
            onClick={() => setActiveTab("videos")}
            label="Video của nhà sáng tạo"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "comments" ? (
            <CommentSection
              key={displayedVideo.id}
              videoId={displayedVideo.id}
              allowComments={displayedVideo.allowComments ?? true}
              embedded
              showHeader={false}
            />
          ) : (
            <RecommendedVideoGrid videos={moreVideos} source="profile" />
          )}
        </div>
      </aside>

      {/* Repost Toast — bottom of video area for profile-detail, top otherwise */}
      {showRepostToast && (
        <div
          className={`fixed z-[300] left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#222] px-5 py-3 text-[14px] font-semibold text-white shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 ${
            usesProfileDetailLayout ? "bottom-8" : "top-6"
          }`}
        >
          <Repeat2 className="size-4 text-yellow-400" />
          Đã đăng lại
        </div>
      )}

    </div>
  );
}

function DetailTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 py-4 text-[17px] font-bold transition ${
        active ? "text-white" : "text-text-muted hover:text-white"
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-white" />}
    </button>
  );
}

function ScrollableDetailVideo({
  video,
  isActive,
  isInitial,
  className,
  controlsVariant,
  onActive,
  onCopyLink,
  onBlockUser,
  blockLabel,
}: {
  video: Video;
  isActive: boolean;
  isInitial?: boolean;
  className?: string;
  controlsVariant?: "default" | "profile-detail";
  onActive: (video: Video) => void;
  onCopyLink: () => void | Promise<void>;
  onBlockUser?: () => void;
  blockLabel?: string;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn phần tử video được click chọn vào tiêu điểm hiển thị ngay khi mount.
  // Điều này cho phép giữ nguyên thứ tự sắp xếp gốc, giúp người dùng có thể lướt ngược lên để xem các video trước đó.
  useEffect(() => {
    if (isInitial && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "start" });
    }
  }, [isInitial]);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(video);
      },
      { threshold: 0.65 },
    );

    observer.observe(item);
    return () => observer.disconnect();
  }, [onActive, video]);

  return (
    <div
      ref={itemRef}
      data-detail-video-id={video.id}
      className="flex h-full w-full items-center justify-center"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      <VideoPlayerContainer
        video={video}
        isActive={isActive}
        controlsVariant={controlsVariant}
        className={className ?? "h-full w-full px-8 py-0"}
        onCopyLink={onCopyLink}
        onOpenSendModal={() => {}}
        onOpenVideoInfo={() => {}}
        onBlockUser={onBlockUser}
        blockLabel={blockLabel}
      />
    </div>
  );
}

function ScrollableFeedDetailVideo({
  video,
  detailSource,
  isInitial,
  onActive,
  onCommentsClick,
  stageOffsetX,
}: {
  video: Video;
  detailSource: string;
  isInitial?: boolean;
  onActive: (video: Video) => void;
  onCommentsClick: () => void;
  stageOffsetX: string;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isInitial && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "start" });
    }
  }, [isInitial]);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(video);
      },
      { threshold: 0.65 },
    );

    observer.observe(item);
    return () => observer.disconnect();
  }, [onActive, video]);

  return (
    <div
      ref={itemRef}
      data-detail-video-id={video.id}
      className="h-full w-full"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
    >
      <VideoCard
        video={video}
        detailSource={detailSource}
        onCommentsClick={onCommentsClick}
        reserveCommentPanelSpace
        stageOffsetX={stageOffsetX}
      />
    </div>
  );
}

function RecommendedVideoGrid({
  videos,
  source = "direct",
}: {
  videos: Video[];
  source?: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-text-secondary">
        Không có video nào khác.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={videoPath(video.username, video.id, { from: source })}
          className="group min-w-0"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-900">
            <Image
              src={video.thumbnailUrl || "/images/default-video-cover.png"}
              alt={video.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center text-[12px] font-bold text-white">
              <Play size={12} className="mr-1 fill-current" />
              {formatCount(video.viewCount)}
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug">{video.title}</p>
          <p className="mt-1 text-[13px] font-semibold text-text-secondary">@{video.username}</p>
        </Link>
      ))}
    </div>
  );
}

function CompactMetric({
  active,
  activeColor = "text-brand",
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  activeColor?: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 font-bold">
      <span
        className={`grid size-11 place-items-center rounded-full bg-elevated ${
          active ? activeColor : "text-white"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function ShareCircle({
  icon,
  onClick,
}: {
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full bg-elevated text-white hover:bg-hover"
    >
      {icon}
    </button>
  );
}

function VideoDetailSkeleton({ mode }: { mode: DetailMode }) {
  return (
    <div className={mode === "direct" ? "flex h-full w-full bg-background" : "fixed inset-0 z-[100] flex bg-background"}>
      <div className="flex-1 animate-pulse bg-neutral-900" />
      <div className="hidden w-[420px] flex-col gap-6 p-6 lg:flex">
        <div className="h-12 rounded bg-neutral-800" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="aspect-[3/4] rounded-lg bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
