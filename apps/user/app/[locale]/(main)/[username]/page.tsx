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
  PlusCircle,
  UserCheck,
  UserPlus,
  Users,
  Link as LinkIcon,
  MapPin,
  Ban,
  Flag,
} from "lucide-react";
import Image from "next/image";
import { ReportModal } from "@/components/report/ReportModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useUserProfile, useFollowMutation, useUnfollowMutation, useBlockUserMutation, useUnblockUserMutation } from "@/hooks/user-hooks";
import { useUserVideos, useLikedVideos } from "@/hooks/video-hooks";
import {
  useCreateCollectionMutation,
  useFavoriteVideos,
  useUserCollections,
} from "@/hooks/collection-hooks";
import { CollectionCard, CollectionFormModal, FavoriteVideoTile } from "@/components/collection/CollectionUi";
import { collectionPath } from "@/utils/collection-url";
import { videoPath } from "@/utils/video-url";
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
  const tCollection = useTranslations('Collection');
  const { data: profileData, isLoading, isError } = useUserProfile(username);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState("video");
  const [favoriteSection, setFavoriteSection] = useState<"posts" | "collections">("posts");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const profile = profileData?.data;
  const isOwnProfileForQueries = !!currentUser && currentUser.username === profile?.username;

  const followMutation = useFollowMutation(username);
  const unfollowMutation = useUnfollowMutation(username);
  const blockMutation = useBlockUserMutation(username);
  const unblockMutation = useUnblockUserMutation(username);
  const createCollectionMutation = useCreateCollectionMutation();

  const { data: userVideosRes, isLoading: isLoadingVideos } = useUserVideos(profile?.id);
  const { data: favoriteVideosRes, isLoading: isLoadingFavorites } = useFavoriteVideos(isOwnProfileForQueries);
  const { data: likedVideosRes, isLoading: isLoadingLiked } = useLikedVideos(isOwnProfileForQueries && activeTab === "liked");
  const { data: userCollectionsRes, isLoading: isLoadingCollections } = useUserCollections(
    username,
    activeTab === "favorites"
  );

  const userVideos = userVideosRes?.data || [];
  const favoriteVideos = favoriteVideosRes?.data || [];
  const likedVideos = likedVideosRes?.data || [];
  const collections = userCollectionsRes?.data || [];

  const displayedVideos =
    activeTab === "video"
      ? userVideos
      : activeTab === "favorites"
      ? favoriteVideos
      : activeTab === "liked"
      ? likedVideos
      : [];
  const isDisplayedLoading =
    activeTab === "video"
      ? isLoadingVideos
      : activeTab === "favorites"
      ? isLoadingFavorites
      : activeTab === "liked"
      ? isLoadingLiked
      : false;

  if (isLoading) {
    return (
      <div className="h-full w-full overflow-y-auto px-5 pt-8 pb-20 sm:px-8 lg:px-10 xl:px-12 animate-pulse">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-start gap-5 lg:gap-8">
            <div className="w-28 h-28 lg:w-44 lg:h-44 rounded-full bg-elevated" />
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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-elevated rounded-sm lg:rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profile || profile.roles?.includes("ROLE_ADMIN")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-text-secondary">
        <p className="text-xl font-bold mb-2">{t('notFoundTitle')}</p>
        <p>{t('notFoundSubtitle')}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;
  const relationship = profile.relationship;
  const isBlocked = Boolean(relationship?.isBlocked);

  const handleFollowToggle = async () => {
    if (!currentUser || isBlocked) return;
    
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

  const handleBlockToggle = async () => {
    if (!currentUser) return;

    try {
      if (isBlocked) {
        await unblockMutation.mutateAsync();
      } else {
        await blockMutation.mutateAsync();
      }
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error("Block action failed:", error);
    }
  };

  const handleCreateCollection = async (payload: { name: string; isPublic: boolean }) => {
    await createCollectionMutation.mutateAsync(payload);
    setIsCreateCollectionOpen(false);
    setFavoriteSection("collections");
  };

  const tabs = [
    { id: "video", label: t('tabs.video'), icon: <Grid3X3 className="w-5 h-5" /> },
    { id: "reposts", label: t('tabs.reposts'), icon: <RotateCcw className="w-5 h-5" /> },
    { id: "favorites", label: t('tabs.favorites'), icon: <Bookmark className="w-5 h-5" />, private: true },
    { id: "liked", label: t('tabs.liked'), icon: <Heart className="w-5 h-5" />, private: true },
  ];

  return (
    <div className="h-full w-full overflow-y-auto px-5 pt-6 pb-20 sm:px-8 lg:px-10 xl:px-12">
      {/* Profile Header */}
      <div className="mb-6 flex max-w-[1220px] flex-col gap-4 lg:mb-7">
        <div className="flex items-start gap-5 lg:gap-8">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-[3px] border-background shadow-xl ring-1 ring-elevated transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32 lg:h-36 lg:w-36">
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
          <div className="min-w-0 flex-1 pt-1 lg:pt-2">
            <div className="mb-2 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="max-w-[420px] truncate text-[28px] font-bold leading-tight tracking-tight lg:text-[30px]">
                {profile.nickname ?? profile.username}
              </h1>
              <div className="hidden h-7 w-px bg-elevated sm:block" />
              <h2 className="max-w-[300px] truncate text-[16px] font-semibold text-text-secondary lg:text-[17px]">
                {profile.username}
              </h2>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[18px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.followingCount ?? 0}</span>
                <span className="text-[16px] text-text-primary">{t('following')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.followersCount ?? 0}</span>
                <span className="text-[16px] text-text-primary">{t('followers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.totalLikes ?? 0}</span>
                <span className="text-[16px] text-text-primary">{t('likes')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex h-9 items-center rounded-full bg-elevated px-5 text-[15px] font-bold transition-colors hover:bg-hover"
                  >
                    {t('editProfile')}
                  </button>
                  <button className="flex h-9 items-center rounded-full bg-elevated px-5 text-[15px] font-bold transition-colors hover:bg-hover">
                    Quảng bá bài đăng
                  </button>
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover">
                    <Share2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  {isBlocked ? (
                    <button
                      onClick={handleBlockToggle}
                      disabled={blockMutation.isPending || unblockMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <Ban className="w-5 h-5" />
                      {t('unblockUser')}
                    </button>
                  ) : relationship?.isFriend ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <Users className="w-5 h-5" />
                      {t('friends')}
                    </button>
                  ) : relationship?.isFollowing ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <UserCheck className="w-5 h-5" />
                      {t('following')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-brand px-7 text-[15px] font-bold text-white transition-all hover:bg-brand/90 active:scale-95 disabled:opacity-50"
                    >
                      <UserPlus className="w-5 h-5" />
                      {relationship?.isFollower ? t('followBack') : t('follow')}
                    </button>
                  )}
                  
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen((value) => !value)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {isProfileMenuOpen && (
                      <div className="absolute left-1/2 top-[52px] z-50 w-[226px] -translate-x-1/2 overflow-visible rounded-xl border border-white/15 bg-[#3f3f3f] p-2 text-white shadow-2xl">
                        <div className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-l border-t border-white/15 bg-[#3f3f3f]" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setIsReportOpen(true);
                          }}
                          className="relative z-10 flex h-[56px] w-full items-center gap-4 rounded-lg px-3 text-left text-[18px] font-bold transition-colors hover:bg-white/10"
                        >
                          <Flag className="size-5 text-white/85" />
                          {t('reportUser')}
                        </button>
                        <div className="mx-3 h-px bg-white/5" />
                        <button
                          type="button"
                          onClick={handleBlockToggle}
                          disabled={blockMutation.isPending || unblockMutation.isPending}
                          className="relative z-10 flex h-[56px] w-full items-center gap-4 rounded-lg px-3 text-left text-[18px] font-bold transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                          <Ban className="size-5 text-white/85" />
                          {isBlocked ? t('unblockUser') : t('blockUser')}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {profile.bio && (
                <p className="max-w-[760px] whitespace-pre-wrap text-[16px] leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {(profile.websiteUrl || profile.instagramHandle || profile.youtubeHandle || profile.region || profile.gender) && (
                <div className="flex flex-wrap items-center gap-4 text-[14px] text-text-secondary">
                  {profile.websiteUrl && (
                    <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-text-primary hover:underline">
                      <LinkIcon className="w-4 h-4" />
                      <span className="max-w-[200px] truncate">{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
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
        </div>

        {isBlocked && (
          <div className="rounded-md border border-elevated bg-elevated/40 px-4 py-3 text-[15px] font-semibold text-text-secondary">
            {t('blockedState')}
          </div>
        )}

      </div>

      {/* Tabs */}
      <div className="relative mb-7 border-b border-elevated">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "favorites" && !isOwnProfile) setFavoriteSection("collections");
              }}
              className={`relative flex h-[54px] min-w-[170px] items-center justify-center gap-2 px-7 text-[18px] font-bold transition-colors whitespace-nowrap lg:text-[20px]
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
      {isBlocked && !isOwnProfile ? null : activeTab === "favorites" ? (
        <div>
          <div className="mb-8 flex items-center justify-between border-b border-elevated">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFavoriteSection("posts")}
                className={`h-12 rounded-md px-4 text-[18px] font-bold transition ${
                  favoriteSection === "posts" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Bài đăng {favoriteVideosRes?.meta?.totalElements ?? favoriteVideos.length}
              </button>
              <button
                type="button"
                onClick={() => setFavoriteSection("collections")}
                className={`h-12 rounded-md px-4 text-[18px] font-bold transition ${
                  favoriteSection === "collections" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Bộ sưu tập {collections.length}
              </button>
            </div>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsCreateCollectionOpen(true)}
                className="flex h-11 items-center gap-2 rounded-full bg-elevated px-5 text-[17px] font-bold hover:bg-hover"
              >
                <PlusCircle className="size-5" />
                Tạo bộ sưu tập mới
              </button>
            )}
          </div>

          {favoriteSection === "posts" && !isOwnProfile ? (
            <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
              <Lock className="mb-4 size-16 opacity-30" />
              <p className="text-xl font-bold">{tCollection("privateFavorites")}</p>
            </div>
          ) : favoriteSection === "posts" ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {isLoadingFavorites ? (
                [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />)
              ) : favoriteVideos.length > 0 ? (
                favoriteVideos.map((video) => (
                  <FavoriteVideoTile key={video.id} video={video} href={videoPath(video.username, video.id, { from: "favorites" })} />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
                  <Lock className="mb-4 size-16 opacity-30" />
                  <p className="text-xl font-bold">{tCollection("emptyFavorites")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {isLoadingCollections ? (
                [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />)
              ) : collections.length > 0 ? (
                collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    href={collectionPath(profile.username, collection)}
                    ownerUsername={profile.username}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
                  <Bookmark className="mb-4 size-16 opacity-30" />
                  <p className="text-xl font-bold">{tCollection("emptyCollections")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {isDisplayedLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-elevated animate-pulse lg:rounded-lg" />
            ))
          ) : displayedVideos.length > 0 ? (
            displayedVideos.map((video) => (
              <FavoriteVideoTile
                key={video.id}
                video={video}
                href={videoPath(video.username, video.id, {
                  from: activeTab === "liked" ? "liked" : "profile",
                })}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
              <Lock className="mb-4 size-16 opacity-20" />
              <p className="text-xl font-bold">{t("empty")}</p>
            </div>
          )}
        </div>
      )}

      <CollectionFormModal
        isOpen={isCreateCollectionOpen}
        title="Bộ sưu tập mới"
        isSubmitting={createCollectionMutation.isPending}
        onClose={() => setIsCreateCollectionOpen(false)}
        onSubmit={handleCreateCollection}
      />

      {profile.id && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="USER"
          targetId={profile.id}
        />
      )}

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}
