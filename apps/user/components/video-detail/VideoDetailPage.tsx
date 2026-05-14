"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVideoDetail, useLikeVideoMutation, useUnlikeVideoMutation, useUserVideos } from "@/hooks/video-hooks";
import { useTranslations } from "next-intl";
import { VideoPlayerContainer } from "./VideoPlayerContainer";
import { VideoActionRail } from "./VideoActionRail";
import CommentSection from "@/components/video/CommentSection";
import { ChevronLeft, Play, X } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import Link from "next/link";
import { formatCount } from "@/utils/format-count";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  
  const rawUsername = params.username as string;
  const videoIdStr = params.videoId as string;
  const videoId = parseInt(videoIdStr);

  // Decode and strip '@' or '%40'
  const decodedUsername = decodeURIComponent(rawUsername);
  const username = decodedUsername.startsWith("@") ? decodedUsername.substring(1) : decodedUsername;
  
  const { data: videoRes, isLoading, isError } = useVideoDetail(username, videoId);
  const video = videoRes?.data;

  const [activeTab, setActiveTab] = useState<"comments" | "videos">("comments");

  // Add a safety check for invalid ID
  if (isNaN(videoId)) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        ID video không hợp lệ.
      </div>
    );
  }

  const { data: moreVideosRes } = useUserVideos(video?.userId);
  const moreVideos = moreVideosRes?.data?.filter(v => v.id !== videoId) || [];

  const likeMutation = useLikeVideoMutation();
  const unlikeMutation = useUnlikeVideoMutation();

  if (isLoading) {
    return <VideoDetailSkeleton />;
  }

  if (isError || !video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-white">
        <h1 className="text-2xl font-bold mb-4">Video không tồn tại</h1>
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col sm:flex-row bg-background animate-in fade-in duration-300 overflow-hidden">
      {/* Close Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-[110] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Main Video Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <VideoPlayerContainer 
          video={video} 
          onCopyLink={() => {
            navigator.clipboard.writeText(window.location.href);
            // Show toast if available
          }}
          onOpenSendModal={() => {}}
          onOpenVideoInfo={() => {}}
        />
        
        {/* Mobile Action Overlay (optional, TikTok shows it on top of video) */}
        <div className="absolute right-4 bottom-20 sm:hidden">
            <VideoActionRail 
                video={video}
                onLike={() => video.isLiked ? unlikeMutation.mutate(video.id) : likeMutation.mutate(video.id)}
                onSave={() => {}}
                onShare={() => {}}
                onFocusComments={() => {}}
            />
        </div>
      </div>

      {/* Desktop Side Panel */}
      <div className="hidden lg:flex flex-col w-[450px] border-l border-white/10 bg-background overflow-y-auto custom-scrollbar">
        {/* Video Info Section */}
        <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img 
                        src={video.userAvatarUrl || "/images/default-avatar.png"} 
                        alt={video.username}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-bold text-[17px] hover:underline cursor-pointer">@{video.username}</h3>
                        <p className="text-[14px] text-text-muted">{video.userNickname || video.username}</p>
                    </div>
                </div>
                <button className="bg-brand text-white px-6 py-1.5 rounded-sm font-bold text-[15px] hover:bg-brand-dark transition-colors">
                    Follow
                </button>
            </div>
            
            <div className="mb-4">
                <p className="text-[16px] whitespace-pre-wrap">{video.description || video.title}</p>
                {/* Hashtags could go here */}
            </div>
            
            <div className="text-[14px] text-text-muted mb-4">
                {new Date(video.createdAt).toLocaleDateString()}
            </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-white/5 px-6">
            <button 
                onClick={() => setActiveTab("comments")}
                className={`flex-1 py-3 text-[15px] font-bold transition-colors relative ${activeTab === "comments" ? "text-white" : "text-text-muted hover:text-white"}`}
            >
                Bình luận ({video.commentCount})
                {activeTab === "comments" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand" />}
            </button>
            <button 
                onClick={() => setActiveTab("videos")}
                className={`flex-1 py-3 text-[15px] font-bold transition-colors relative ${activeTab === "videos" ? "text-white" : "text-text-muted hover:text-white"}`}
            >
                Video của nhà sáng tạo
                {activeTab === "videos" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand" />}
            </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "comments" ? (
                <div className="h-full">
                    <CommentSection videoId={video.id} />
                </div>
            ) : (
                <div className="p-4 grid grid-cols-3 gap-1">
                    {moreVideos.map((v) => (
                        <Link 
                            key={v.id} 
                            href={`/@${v.username}/${v.id}`}
                            className="relative aspect-[3/4] bg-neutral-900 overflow-hidden group"
                        >
                            <img 
                                src={v.thumbnailUrl || "/images/default-video-cover.png"} 
                                alt={v.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute bottom-1 left-1 flex items-center text-white text-[10px] font-bold">
                                <Play size={10} className="mr-0.5 fill-current" />
                                {formatCount(v.viewCount)}
                            </div>
                        </Link>
                    ))}
                    {moreVideos.length === 0 && (
                        <div className="col-span-3 py-10 text-center text-text-muted">
                            Không có video nào khác.
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function VideoDetailSkeleton() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col sm:flex-row bg-background">
            <div className="flex-1 bg-neutral-900 animate-pulse" />
            <div className="hidden lg:flex flex-col w-[450px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 animate-pulse" />
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-neutral-800 rounded animate-pulse" />
                        <div className="w-24 h-3 bg-neutral-800 rounded animate-pulse" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="w-full h-4 bg-neutral-800 rounded animate-pulse" />
                    <div className="w-3/4 h-4 bg-neutral-800 rounded animate-pulse" />
                </div>
                <div className="flex-1 space-y-6 pt-10">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-neutral-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-neutral-800 rounded w-1/3" />
                                <div className="h-3 bg-neutral-800 rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
