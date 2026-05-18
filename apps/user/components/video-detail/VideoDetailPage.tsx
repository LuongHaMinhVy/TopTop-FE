"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useLikeVideoMutation,
  useAllVideos,
  useUnlikeVideoMutation,
  useUserVideos,
  useVideoDetail,
} from "@/hooks/video-hooks";
import { useBlockUserMutation } from "@/hooks/user-hooks";
import {
  usePublicCollectionVideos,
  useSaveVideoMutation,
  useUnsaveVideoMutation,
} from "@/hooks/collection-hooks";
import { VideoPlayerContainer } from "./VideoPlayerContainer";
import { VideoActionRail } from "./VideoActionRail";
import { AddToCollectionModal } from "@/components/collection/AddToCollectionModal";
import CommentSection from "@/components/video/CommentSection";
import {
  ChevronLeft,
  Code2,
  Copy,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Play,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCount } from "@/utils/format-count";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import type { Video } from "@/types/video";
import { useTranslations } from "next-intl";
import { videoPath } from "@/utils/video-url";
import Facebook from "@/components/shared/icons/FaceBookIcon";

type DetailMode = "direct" | "internal";
type DetailTab = "comments" | "videos";
const SCROLLABLE_DETAIL_SOURCES = new Set(["feed", "explore", "friends", "following", "profile", "collection"]);

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
  const collectionIdParam = searchParams.get("collectionId");
  const collectionId = collectionIdParam ? Number(collectionIdParam) : undefined;
  const collectionOwner = searchParams.get("collectionOwner") ?? username;
  const detailMode: DetailMode = source ? "internal" : "direct";
  const isProfileDetail = source === "profile";
  const isCollectionDetail = source === "collection" && Number.isFinite(collectionId) && Number(collectionId) > 0;
  const usesProfileDetailLayout = isProfileDetail || source === "collection";
  const isScrollableDetail = source ? SCROLLABLE_DETAIL_SOURCES.has(source) : false;
  const commentsRequested = searchParams.get("comments") === "1";
  const defaultTab: DetailTab = commentsRequested ? "comments" : detailMode === "direct" ? "videos" : "comments";

  const { data: videoRes, isLoading, isError } = useVideoDetail(username, videoId);
  const video = videoRes?.data;
  const { data: allVideosRes } = useAllVideos();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [optimisticVideo, setOptimisticVideo] = useState<Video | null>(null);
  const [activeScrollableVideo, setActiveScrollableVideo] = useState<Video | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const initializedScrollableVideoIdRef = useRef<number | null>(null);
  const displayedVideo = optimisticVideo ?? activeScrollableVideo ?? video;
  const { data: moreVideosRes } = useUserVideos(displayedVideo?.userId);
  const likeMutation = useLikeVideoMutation();
  const unlikeMutation = useUnlikeVideoMutation();
  const saveMutation = useSaveVideoMutation();
  const unsaveMutation = useUnsaveVideoMutation();
  const blockMutation = useBlockUserMutation(displayedVideo?.username ?? username);
  const { data: collectionVideosRes } = usePublicCollectionVideos(
    collectionOwner,
    collectionId,
    isCollectionDetail,
    0,
    18,
  );
  const moreVideos = useMemo(
    () => moreVideosRes?.data?.filter((item) => item.id !== displayedVideo?.id) ?? [],
    [displayedVideo?.id, moreVideosRes?.data],
  );
  const detailScopeParams = useMemo(() => {
    if (source !== "collection") return { from: source ?? "feed" };

    return {
      from: "collection",
      collectionId: isCollectionDetail ? collectionId : undefined,
      collectionOwner,
    };
  }, [collectionId, collectionOwner, isCollectionDetail, source]);
  const scrollableVideos = useMemo(() => {
    let videos: Video[] = [];

    if (source === "profile") {
      videos = moreVideosRes?.data ?? [];
    } else if (source === "collection") {
      videos = collectionVideosRes?.data ?? [];
    } else {
      videos = allVideosRes?.data ?? [];
    }

    if (!video) return videos;

    if (videos.some((item) => item.id === video.id)) return videos;
    return [video, ...videos];
  }, [allVideosRes?.data, collectionVideosRes?.data, moreVideosRes?.data, source, video]);
  const canBlockAuthor = Boolean(currentUser && displayedVideo && currentUser.id !== displayedVideo.userId);
  const canonicalPath = displayedVideo ? videoPath(displayedVideo.username, displayedVideo.id) : "";
  const shareUrl = typeof window !== "undefined" && canonicalPath ? `${window.location.origin}${canonicalPath}` : "";

  useEffect(() => {
    if (!isScrollableDetail || !video) return;
    if (initializedScrollableVideoIdRef.current === video.id) return;

    initializedScrollableVideoIdRef.current = video.id;
    setActiveScrollableVideo(video);
    setOptimisticVideo(null);
  }, [isScrollableDetail, video]);

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
          if (!response.data) return;
          setOptimisticVideo({
            ...previousVideo,
            isLiked: response.data.liked,
            likeCount: response.data.likeCount,
            commentCount: response.data.commentCount,
            saveCount: response.data.saveCount,
            shareCount: response.data.shareCount,
          });
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
          if (!response.data) return;
          setOptimisticVideo({
            ...previousVideo,
            isLiked: response.data.liked,
            likeCount: response.data.likeCount,
            commentCount: response.data.commentCount,
            saveCount: response.data.saveCount,
            shareCount: response.data.shareCount,
          });
        },
        onError: () => setOptimisticVideo(previousVideo),
      });
    }
  };

  const handleSave = () => {
    if (!displayedVideo || !requireLogin()) return;

    const previousVideo = displayedVideo;
    const nextSaved = !previousVideo.isSaved;
    setOptimisticVideo({
      ...previousVideo,
      isSaved: nextSaved,
      saveCount: Math.max(0, (previousVideo.saveCount ?? 0) + (nextSaved ? 1 : -1)),
    });

    if (nextSaved) {
      saveMutation.mutate(previousVideo.id, {
        onSuccess: (response) => {
          setOptimisticVideo(response.data ?? null);
          setIsCollectionModalOpen(true);
        },
        onError: () => setOptimisticVideo(previousVideo),
      });
    } else {
      unsaveMutation.mutate(previousVideo.id, {
        onSuccess: (response) => setOptimisticVideo(response.data ?? null),
        onError: () => setOptimisticVideo(previousVideo),
      });
    }
  };

  const handleBlockUser = () => {
    if (!displayedVideo || !requireLogin()) return;

    blockMutation.mutate(undefined, {
      onSuccess: () => setIsUnavailable(true),
    });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
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
        <div className="relative flex min-w-0 flex-1 items-center justify-center bg-black">
          <VideoPlayerContainer {...commonPlayerProps} className="h-full w-full px-6 py-5" />
          <VideoActionRail
            video={displayedVideo}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleCopyLink}
            onFocusComments={() => setActiveTab("comments")}
          />
        </div>

        <aside className="hidden w-[462px] flex-shrink-0 flex-col border-l border-white/10 bg-background lg:flex">
          {commentsRequested ? (
            <div className="flex h-16 items-center justify-between px-6">
              <h2 className="text-[20px] font-bold">Bình luận {formatCount(displayedVideo.commentCount)}</h2>
              <button
                type="button"
                onClick={() => router.back()}
                className="grid size-9 place-items-center rounded-full bg-elevated hover:bg-hover"
              >
                <X className="size-5" /> 
              </button>
            </div>
          ) : (
            <div className="h-24" />
          )}

          {!commentsRequested && (
            <div className="flex border-b border-white/10 px-8">
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
          )}

          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "comments" || commentsRequested ? (
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

        <AddToCollectionModal
          isOpen={isCollectionModalOpen}
          videoId={displayedVideo.id}
          onClose={() => setIsCollectionModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[#111] text-white animate-in fade-in duration-200">
      <button
        onClick={() => router.back()}
        className="absolute left-6 top-6 z-[120] grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={30} />
      </button>

      <div className={`relative min-w-0 flex-1 ${usesProfileDetailLayout ? "bg-black" : "bg-[#161616]"}`}>
        {isScrollableDetail && scrollableVideos.length > 0 ? (
          <div
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
                controlsVariant={usesProfileDetailLayout ? "profile-detail" : "default"}
                className={usesProfileDetailLayout ? "h-full w-full p-0" : "h-full w-full px-8 py-0"}
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
            controlsVariant={usesProfileDetailLayout ? "profile-detail" : "default"}
            className={usesProfileDetailLayout ? "h-full w-full p-0" : "h-full w-full px-8 py-0"}
          />
        )}
      </div>

      <aside
        className={`hidden flex-shrink-0 flex-col border-l border-white/10 bg-background xl:flex ${
          usesProfileDetailLayout ? "w-[38vw] min-w-[480px] max-w-[680px]" : "w-[680px]"
        }`}
      >
        <div className="border-b border-white/10 p-6">
          <div className="mb-5 rounded-xl bg-elevated/70 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <Link href={`/@${displayedVideo.username}`} className="flex min-w-0 items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-full bg-surface">
                  <Image
                    src={displayedVideo.userAvatarUrl || "/default-avatar.png"}
                    alt={displayedVideo.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-[20px] font-bold">@{displayedVideo.username}</h3>
                  <p className="truncate text-[15px] font-semibold text-text-secondary">
                    {displayedVideo.userNickname || displayedVideo.username}
                    {" · "}
                    {new Date(displayedVideo.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </Link>
            </div>
            <p className="whitespace-pre-wrap text-[17px] leading-snug">
              {displayedVideo.description || displayedVideo.title}
            </p>
            <p className="mt-3 text-[15px] font-semibold text-text-secondary">
              ♫ {t("originalSound", { username: displayedVideo.username })}
            </p>
          </div>

          <div className="mb-5 flex items-center gap-4">
            <CompactMetric
              active={displayedVideo.isLiked}
              icon={<Heart className={displayedVideo.isLiked ? "fill-current" : ""} size={22} />}
              label={formatCount(displayedVideo.likeCount)}
              onClick={handleLike}
            />
            <CompactMetric
              icon={<MessageCircle size={22} />}
              label={formatCount(displayedVideo.commentCount)}
              onClick={() => setActiveTab("comments")}
            />
            <CompactMetric
              icon={<Share2 size={22} />}
              label={formatCount(displayedVideo.shareCount ?? 0)}
              onClick={handleCopyLink}
            />
            <div className="ml-auto flex items-center gap-2">
              <ShareCircle icon={<Code2 size={18} />} />
              <ShareCircle icon={<Facebook className="size-5" />} />
              <ShareCircle icon={<LinkIcon size={18} />} onClick={handleCopyLink} />
            </div>
          </div>

          <div className="flex h-10 overflow-hidden rounded-md bg-elevated">
            <div className="min-w-0 flex-1 truncate px-4 py-2 text-[15px] text-text-secondary">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-hover px-5 text-[15px] font-bold hover:bg-white/15"
            >
              <Copy className="size-4" />
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

      <AddToCollectionModal
        isOpen={isCollectionModalOpen}
        videoId={displayedVideo.id}
        onClose={() => setIsCollectionModalOpen(false)}
      />
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
  className,
  controlsVariant,
  onActive,
  onCopyLink,
  onBlockUser,
  blockLabel,
}: {
  video: Video;
  isActive: boolean;
  className?: string;
  controlsVariant?: "default" | "profile-detail";
  onActive: (video: Video) => void;
  onCopyLink: () => void | Promise<void>;
  onBlockUser?: () => void;
  blockLabel?: string;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);

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
    <div className="grid grid-cols-2 gap-5 p-8">
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
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 font-bold">
      <span
        className={`grid size-11 place-items-center rounded-full bg-elevated ${
          active ? "text-brand" : "text-white"
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
      <div className="hidden w-[462px] flex-col gap-6 p-6 lg:flex">
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
