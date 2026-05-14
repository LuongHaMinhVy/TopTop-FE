"use client";

import { useParams, notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Lock, 
  Settings, 
  Share2, 
  MoreHorizontal, 
  Grid3X3, 
  RotateCcw, 
  Bookmark, 
  Heart,
  Play,
  UserCheck,
  UserPlus,
  Users,
  Link as LinkIcon,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useUserProfile, useFollowMutation, useUnfollowMutation } from "@/hooks/user-hooks";
import { useUserVideos, useFavoriteVideos } from "@/hooks/video-hooks";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useState } from "react";

export default function ProfilePage() {
  const params = useParams();
  const rawUsername = params.username as string;
  
  if (!rawUsername.startsWith("%40") && !rawUsername.startsWith("@")) {
    notFound();
  }

  const username = rawUsername.startsWith("%40") ? rawUsername.substring(3) : rawUsername.substring(1);
  
  const t = useTranslations('profile');
  const { data: profileData, isLoading, isError } = useUserProfile(username);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState("video");

  const followMutation = useFollowMutation(username);
  const unfollowMutation = useUnfollowMutation(username);

  const { data: userVideosRes, isLoading: isLoadingVideos } = useUserVideos(profileData?.data?.id);
  const { data: favoriteVideosRes, isLoading: isLoadingFavorites } = useFavoriteVideos();

  const userVideos = userVideosRes?.data || [];
  const favoriteVideos = favoriteVideosRes?.data || [];

  const displayedVideos = activeTab === "video" ? userVideos : activeTab === "favorites" ? favoriteVideos : [];
  const isDisplayedLoading = activeTab === "video" ? isLoadingVideos : activeTab === "favorites" ? isLoadingFavorites : false;

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 lg:px-0 pt-8 pb-20 animate-pulse">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-start gap-5 lg:gap-8">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-elevated" />
            <div className="flex-1 pt-1">
              <div className="h-8 w-48 bg-elevated rounded-md mb-2" />
              <div className="h-5 w-32 bg-elevated rounded-md mb-6" />
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-elevated rounded-[4px]" />
                <div className="h-10 w-10 bg-elevated rounded-[4px]" />
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="h-6 w-20 bg-elevated rounded" />
            <div className="h-6 w-20 bg-elevated rounded" />
            <div className="h-6 w-20 bg-elevated rounded" />
          </div>
          <div className="h-4 w-full max-w-[500px] bg-elevated rounded" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex border-b border-elevated mb-6">
          <div className="h-12 w-24 bg-elevated/50 rounded-t-md mx-2" />
          <div className="h-12 w-24 bg-elevated/50 rounded-t-md mx-2" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-1 lg:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-elevated rounded-sm lg:rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profileData?.data || profileData.data.roles?.includes("ROLE_ADMIN")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-text-secondary">
        <p className="text-xl font-bold mb-2">{t('notFoundTitle')}</p>
        <p>{t('notFoundSubtitle')}</p>
      </div>
    );
  }

  const profile = profileData.data;
  const isOwnProfile = currentUser?.username === profile.username;
  const relationship = profile.relationship;

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    try {
      if (relationship?.isFollowing) {
        await unfollowMutation.mutateAsync();
      } else {
        await followMutation.mutateAsync();
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    }
  };

  const tabs = [
    { id: "video", label: t('tabs.video'), icon: <Grid3X3 className="w-5 h-5" /> },
    { id: "reposts", label: t('tabs.reposts'), icon: <RotateCcw className="w-5 h-5" /> },
    { id: "favorites", label: t('tabs.favorites'), icon: <Bookmark className="w-5 h-5" />, private: true },
    { id: "liked", label: t('tabs.liked'), icon: <Heart className="w-5 h-5" />, private: true },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 lg:px-0 pt-8 pb-20">
      {/* Profile Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-start gap-5 lg:gap-8">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-[3px] border-background shadow-xl ring-1 ring-elevated transition-transform duration-300 group-hover:scale-105">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={profile.nickname ?? ""} fill className="object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-brand/10 flex items-center justify-center text-brand text-3xl font-bold">
                  {(profile.nickname ?? profile.username ?? "U")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col gap-1 mb-4">
              <h1 className="text-2xl lg:text-[32px] font-bold tracking-tight truncate leading-tight flex items-center gap-2">
                {profile.nickname ?? profile.username}
                
              </h1>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] lg:text-[18px] font-semibold text-text-primary truncate">
                  {profile.username}
                </h2>
                
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {isOwnProfile ? (
                <>
                  <button className="flex items-center gap-2 px-6 h-11 rounded-[4px] bg-elevated hover:bg-hover font-bold text-[16px] transition-colors">
                    <Settings className="w-5 h-5" />
                    {t('editProfile')}
                  </button>
                  <button className="flex items-center justify-center w-11 h-11 rounded-[4px] bg-elevated hover:bg-hover transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-11 h-11 rounded-[4px] bg-elevated hover:bg-hover transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  {relationship?.isFriend ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex items-center gap-2 px-8 h-11 rounded-[4px] bg-elevated hover:bg-hover font-bold text-[16px] transition-colors disabled:opacity-50"
                    >
                      <Users className="w-5 h-5" />
                      {t('friends')}
                    </button>
                  ) : relationship?.isFollowing ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex items-center gap-2 px-8 h-11 rounded-[4px] bg-elevated hover:bg-hover font-bold text-[16px] transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-5 h-5" />
                      {t('following')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex items-center gap-2 px-10 h-11 rounded-[4px] bg-brand hover:bg-brand/90 text-white font-bold text-[16px] transition-all active:scale-95 disabled:opacity-50"
                    >
                      <UserPlus className="w-5 h-5" />
                      {relationship?.isFollower ? t('followBack') : t('follow')}
                    </button>
                  )}
                  
                  <button className="flex items-center justify-center w-11 h-11 rounded-[4px] bg-elevated hover:bg-hover transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-11 h-11 rounded-[4px] bg-elevated hover:bg-hover transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[18px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{profile.followingCount ?? 0}</span>
            <span className="text-text-secondary text-[16px]">{t('following')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{profile.followersCount ?? 0}</span>
            <span className="text-text-secondary text-[16px]">{t('followers')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{profile.totalLikes ?? 0}</span>
            <span className="text-text-secondary text-[16px]">{t('likes')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{profile.videoCount ?? 0}</span>
            <span className="text-text-secondary text-[16px]">{t('tabs.video')}</span>
          </div>
        </div>

        {/* Bio and Links */}
        <div className="flex flex-col gap-3">
          {profile.bio && (
            <p className="text-[16px] leading-relaxed max-w-[600px] whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Social Links & Info */}
          {(profile.websiteUrl || profile.instagramHandle || profile.youtubeHandle || profile.region || profile.gender) && (
            <div className="flex flex-wrap items-center gap-4 text-[14px] text-text-secondary">
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-text-primary transition-colors hover:underline">
                  <LinkIcon className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profile.region && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.region}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative border-b border-elevated mb-4">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-2 px-8 h-[52px] font-bold text-[16px] lg:text-[18px] transition-colors whitespace-nowrap
                ${activeTab === tab.id ? "text-text-primary" : "text-text-muted hover:text-text-secondary"}
              `}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary animate-in fade-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-1 lg:gap-4">
        {isDisplayedLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative aspect-[3/4] bg-elevated rounded-sm lg:rounded-lg overflow-hidden animate-pulse" />
          ))
        ) : displayedVideos.length > 0 ? (
          displayedVideos.map((video) => (
            <div key={video.id} className="relative aspect-[3/4] bg-elevated rounded-xl lg:rounded-2xl overflow-hidden group cursor-pointer">
              <div className="w-full h-full bg-gradient-to-b from-transparent to-black/40 absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-white text-[12px] lg:text-[14px] font-bold opacity-90">
                <Play className="w-3 h-3 lg:w-4 lg:h-4 fill-white" />
                {video.viewCount || 0}
              </div>
              <video 
                src={video.fileUrl} 
                className="w-full h-full object-cover"
                muted
                onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                onMouseOut={(e) => {
                  (e.target as HTMLVideoElement).pause();
                  (e.target as HTMLVideoElement).currentTime = 0;
                }}
              />
            </div>
          ))
        ) : (
          <div className="col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-20 text-text-secondary">
            <Lock className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold">{t('empty')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
