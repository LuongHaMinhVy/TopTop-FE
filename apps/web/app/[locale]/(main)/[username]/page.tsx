"use client";

import { useParams, notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Lock, 
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
  MessageCircle,
  Music,
} from "lucide-react";
import Image from "next/image";
import { ReportModal } from "@/components/report/ReportModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useUserProfile, useFollowMutation, useUnfollowMutation, useBlockUserMutation, useUnblockUserMutation } from "@/hooks/user-hooks";
import { useCreateConversation } from "@/hooks/chat-hooks";
import { useInfiniteUserVideos, useInfiniteLikedVideos, useInfiniteUserLikedVideos, useInfiniteUserRepostedVideos } from "@/hooks/video-hooks";
import {
  useCollections,
  useCreateCollectionMutation,
  useInfiniteFavoriteVideos,
  useUserCollections,
} from "@/hooks/collection-hooks";
import { CollectionCard, CollectionFormModal, FavoriteSoundTile, FavoriteVideoTile } from "@/components/collection/CollectionUi";
import { useFavoriteSounds } from "@/hooks/sound-hooks";
import { collectionPath } from "@/utils/collection-url";
import { videoPath } from "@/utils/video-url";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
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
  const [favoriteSection, setFavoriteSection] = useState<"posts" | "collections" | "sounds">("posts");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const profile = profileData?.data;
  const isOwnProfileForQueries = !!currentUser && currentUser.username === profile?.username;
  const privacySettings = profile?.privacySettings;
  const canViewPosts = isOwnProfileForQueries || privacySettings?.showPosts !== false;
  const canViewReposts = isOwnProfileForQueries || privacySettings?.showReposts !== false;
  const canViewLikedVideos = isOwnProfileForQueries || privacySettings?.showLikedVideos === true;
  const canViewFavorites = isOwnProfileForQueries || privacySettings?.showFavorites === true;
  const visibleActiveTab = activeTab === "reposts" && !canViewReposts ? "video" : activeTab;

  // Tab sliding indicator state
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [hoveredPreviewVideoId, setHoveredPreviewVideoId] = useState<number | null>(null);

  const followMutation = useFollowMutation(username);
  const unfollowMutation = useUnfollowMutation(username);
  const blockMutation = useBlockUserMutation(username);
  const unblockMutation = useUnblockUserMutation(username);
  const createCollectionMutation = useCreateCollectionMutation();
  const createConversationMutation = useCreateConversation();

  const {
    data: userVideosRes,
    isLoading: isLoadingVideos,
    fetchNextPage: fetchNextUserVideos,
    hasNextPage: hasNextUserVideos,
    isFetchingNextPage: isFetchingNextUserVideos,
  } = useInfiniteUserVideos(
    profile?.id,
    visibleActiveTab === "video" && canViewPosts,
  );

  const {
    data: repostedVideosRes,
    isLoading: isLoadingReposts,
    fetchNextPage: fetchNextReposts,
    hasNextPage: hasNextReposts,
    isFetchingNextPage: isFetchingNextReposts,
  } = useInfiniteUserRepostedVideos(
    username,
    visibleActiveTab === "reposts" && canViewReposts,
  );

  const {
    data: favoriteVideosRes,
    isLoading: isLoadingFavorites,
    fetchNextPage: fetchNextFavorites,
    hasNextPage: hasNextFavorites,
    isFetchingNextPage: isFetchingNextFavorites,
  } = useInfiniteFavoriteVideos(
    isOwnProfileForQueries && visibleActiveTab === "favorites" && favoriteSection === "posts",
  );

  const {
    data: ownLikedVideosRes,
    isLoading: isLoadingOwnLiked,
    fetchNextPage: fetchNextOwnLiked,
    hasNextPage: hasNextOwnLiked,
    isFetchingNextPage: isFetchingNextOwnLiked,
  } = useInfiniteLikedVideos(
    isOwnProfileForQueries && visibleActiveTab === "liked" && canViewLikedVideos,
  );

  const {
    data: userLikedVideosRes,
    isLoading: isLoadingUserLiked,
    fetchNextPage: fetchNextUserLiked,
    hasNextPage: hasNextUserLiked,
    isFetchingNextPage: isFetchingNextUserLiked,
  } = useInfiniteUserLikedVideos(
    username,
    !isOwnProfileForQueries && visibleActiveTab === "liked" && canViewLikedVideos,
  );

  // For own profile: use authenticated endpoint (includes private collections)
  // For other profiles: use public endpoint (public collections only)
  const { data: ownCollectionsRes, isLoading: isLoadingOwnCollections } = useCollections(
    isOwnProfileForQueries && visibleActiveTab === "favorites"
  );
  const { data: userCollectionsRes, isLoading: isLoadingPublicCollections } = useUserCollections(
    username,
    !isOwnProfileForQueries && visibleActiveTab === "favorites"
  );
  const isLoadingCollections = isOwnProfileForQueries ? isLoadingOwnCollections : isLoadingPublicCollections;
  const { data: soundsRes, isLoading: isLoadingSounds } = useFavoriteSounds(
    isOwnProfileForQueries && visibleActiveTab === "favorites",
    0,
    50,
  );

  const userVideos = useMemo(() => userVideosRes?.pages.flatMap((page) => page.data ?? []) ?? [], [userVideosRes?.pages]);
  const repostedVideos = useMemo(() => repostedVideosRes?.pages.flatMap((page) => page.data ?? []) ?? [], [repostedVideosRes?.pages]);
  const favoriteVideos = useMemo(() => favoriteVideosRes?.pages.flatMap((page) => page.data ?? []) ?? [], [favoriteVideosRes?.pages]);
  const likedVideos = useMemo(
    () => (isOwnProfileForQueries ? ownLikedVideosRes : userLikedVideosRes)?.pages.flatMap((page) => page.data ?? []) ?? [],
    [isOwnProfileForQueries, ownLikedVideosRes, userLikedVideosRes],
  );
  const collections = useMemo(
    () => (isOwnProfileForQueries ? ownCollectionsRes?.data : userCollectionsRes?.data) ?? [],
    [isOwnProfileForQueries, ownCollectionsRes?.data, userCollectionsRes?.data]
  );
  const favoriteSounds = useMemo(() => soundsRes?.data ?? [], [soundsRes?.data]);
  const displayedVideos = useMemo(() => {
    if (visibleActiveTab === "video") return userVideos;
    if (visibleActiveTab === "reposts") return repostedVideos;
    if (visibleActiveTab === "favorites" && favoriteSection === "posts") return favoriteVideos;
    if (visibleActiveTab === "liked") return likedVideos;
    return [];
  }, [favoriteVideos, likedVideos, repostedVideos, userVideos, visibleActiveTab, favoriteSection]);

  const isDisplayedLoading =
    visibleActiveTab === "video"
      ? isLoadingVideos
      : visibleActiveTab === "reposts"
      ? isLoadingReposts
      : visibleActiveTab === "favorites" && favoriteSection === "posts"
      ? isLoadingFavorites
      : visibleActiveTab === "liked"
      ? isOwnProfileForQueries ? isLoadingOwnLiked : isLoadingUserLiked
      : false;

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useMemo(() => {
    if (visibleActiveTab === "video") {
      return {
        fetchNextPage: fetchNextUserVideos,
        hasNextPage: hasNextUserVideos,
        isFetchingNextPage: isFetchingNextUserVideos,
      };
    }
    if (visibleActiveTab === "reposts") {
      return {
        fetchNextPage: fetchNextReposts,
        hasNextPage: hasNextReposts,
        isFetchingNextPage: isFetchingNextReposts,
      };
    }
    if (visibleActiveTab === "favorites" && favoriteSection === "posts") {
      return {
        fetchNextPage: fetchNextFavorites,
        hasNextPage: hasNextFavorites,
        isFetchingNextPage: isFetchingNextFavorites,
      };
    }
    if (visibleActiveTab === "liked") {
      return isOwnProfileForQueries
        ? {
            fetchNextPage: fetchNextOwnLiked,
            hasNextPage: hasNextOwnLiked,
            isFetchingNextPage: isFetchingNextOwnLiked,
          }
        : {
            fetchNextPage: fetchNextUserLiked,
            hasNextPage: hasNextUserLiked,
            isFetchingNextPage: isFetchingNextUserLiked,
          };
    }
    return {
      fetchNextPage: () => {},
      hasNextPage: false,
      isFetchingNextPage: false,
    };
  }, [
    visibleActiveTab,
    favoriteSection,
    isOwnProfileForQueries,
    fetchNextUserVideos,
    hasNextUserVideos,
    isFetchingNextUserVideos,
    fetchNextReposts,
    hasNextReposts,
    isFetchingNextReposts,
    fetchNextFavorites,
    hasNextFavorites,
    isFetchingNextFavorites,
    fetchNextOwnLiked,
    hasNextOwnLiked,
    isFetchingNextOwnLiked,
    fetchNextUserLiked,
    hasNextUserLiked,
    isFetchingNextUserLiked,
  ]);

  const observer = useRef<IntersectionObserver>(null);
  const lastVideoRef = useCallback(
    (node: HTMLDivElement) => {
      if (isDisplayedLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isDisplayedLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );
  const firstPreviewVideoId = useMemo(
    () => displayedVideos.find((video) => !video.unavailable && !video.deleted && video.fileUrl)?.id ?? null,
    [displayedVideos],
  );
  const activePreviewVideoId = displayedVideos.some((video) => video.id === hoveredPreviewVideoId)
    ? hoveredPreviewVideoId
    : firstPreviewVideoId;

  const updateIndicator = (tabId: string) => {
    const btnEl = tabRefs.current[tabId];
    if (btnEl) {
      setIndicatorStyle({
        left: btnEl.offsetLeft,
        width: btnEl.offsetWidth,
        opacity: 1
      });
    }
  };

  useEffect(() => {
    updateIndicator(hoveredTabId || visibleActiveTab);
  }, [hoveredTabId, visibleActiveTab]);

  useEffect(() => {
    const handleResize = () => {
      updateIndicator(hoveredTabId || visibleActiveTab);
    };
    
    const timer = setTimeout(() => updateIndicator(hoveredTabId || visibleActiveTab), 100);
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [hoveredTabId, visibleActiveTab]);

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
  const canMessage = Boolean(currentUser && !isOwnProfile && !isBlocked);
  const profileTitle = `${profile.nickname || profile.username} (@${profile.username}) | TopTop`;

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

  const handleOpenMessage = async () => {
    if (!currentUser || !profile?.id || !canMessage) return;

    try {
      const response = await createConversationMutation.mutateAsync(profile.id);
      if (response.data?.id) {
        router.push(`/messages?conversation=${response.data.id}`);
      } else {
        router.push("/messages");
      }
    } catch (error) {
      console.error("Create conversation failed:", error);
    }
  };

  const tabs = [
    { id: "video", label: t('tabs.video'), icon: <Grid3X3 className="w-5 h-5" /> },
    { id: "reposts", label: t('tabs.reposts'), icon: <RotateCcw className="w-5 h-5" /> },
    { id: "favorites", label: t('tabs.favorites'), icon: <Bookmark className="w-5 h-5" />, private: true },
    { id: "liked", label: t('tabs.liked'), icon: <Heart className="w-5 h-5" />, private: true },
  ].filter((tab) => tab.id !== "reposts" || canViewReposts);

  const hiddenContent =
    visibleActiveTab === "video" && !canViewPosts
      ? { title: t("hiddenContent.postsTitle"), description: t("hiddenContent.postsDescription") }
      : visibleActiveTab === "liked" && !canViewLikedVideos
        ? { title: t("hiddenContent.likedTitle"), description: t("hiddenContent.likedDescription") }
        : null;

  return (
    <div className="h-full w-full overflow-y-auto px-5 pt-5 pb-20 sm:px-8 lg:px-9 xl:px-10">
      <DocumentTitle title={profileTitle} />
      {/* Profile Header */}
      <div className="mb-5 flex max-w-[1160px] flex-col gap-3.5 lg:mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start lg:gap-7">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-[3px] border-background shadow-xl ring-1 ring-elevated transition-transform duration-300 group-hover:scale-105 sm:h-[120px] sm:w-[120px] lg:h-[132px] lg:w-[132px]">
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
          <div className="min-w-0 flex-1 pt-1 lg:pt-1.5">
            <div className="mb-2 flex min-w-0 flex-wrap items-baseline gap-x-3.5 gap-y-1">
              <h1 className="max-w-full truncate text-[27px] font-bold leading-tight tracking-tight sm:max-w-[400px] lg:text-[29px]">
                {profile.nickname ?? profile.username}
              </h1>
              <div className="hidden h-7 w-px bg-elevated sm:block" />
              <h2 className="max-w-full truncate text-[15px] font-semibold text-text-secondary sm:max-w-[280px] lg:text-[16px]">
                {profile.username}
              </h2>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[17px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.followingCount ?? 0}</span>
                <span className="text-[15px] text-text-primary">{t('following')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.followersCount ?? 0}</span>
                <span className="text-[15px] text-text-primary">{t('followers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">{profile.totalLikes ?? 0}</span>
                <span className="text-[15px] text-text-primary">{t('likes')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex h-9 items-center rounded-full bg-elevated px-5 text-[15px] font-bold transition-colors hover:bg-hover"
                  >
                    {t('editProfile')}
                  </button>
                  
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover">
                    <Share2 className="size-5" />
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
                      <Ban className="size-5" />
                      {t('unblockUser')}
                    </button>
                  ) : relationship?.isFriend ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <Users className="size-5" />
                      {t('friends')}
                    </button>
                  ) : relationship?.isFollowing ? (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <UserCheck className="size-5" />
                      {t('following')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-brand px-7 text-[15px] font-bold text-white transition-all hover:bg-brand/90 active:scale-95 disabled:opacity-50"
                    >
                      <UserPlus className="size-5" />
                      {relationship?.isFollower ? t('followBack') : t('follow')}
                    </button>
                  )}

                  {canMessage && (
                    <button
                      type="button"
                      onClick={handleOpenMessage}
                      disabled={createConversationMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded-full bg-elevated px-6 text-[15px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <MessageCircle className="size-5" />
                      Tin nhắn
                    </button>
                  )}
                  
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover">
                    <Share2 className="size-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen((value) => !value)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated transition-colors hover:bg-hover"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-[52px] z-50 w-[226px] overflow-visible rounded-xl border border-elevated bg-background p-2 text-text-primary shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                        <div className="absolute -top-2 right-3 size-4 rotate-45 border-l border-t border-elevated bg-background sm:left-1/2 sm:right-auto sm:-translate-x-1/2" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setIsReportOpen(true);
                          }}
                          className="relative z-10 flex h-[56px] w-full items-center gap-4 rounded-lg px-3 text-left text-[18px] font-bold transition-colors hover:bg-hover"
                        >
                          <Flag className="size-5 text-text-secondary" />
                          {t('reportUser')}
                        </button>
                        <div className="mx-3 h-px bg-elevated" />
                        <button
                          type="button"
                          onClick={handleBlockToggle}
                          disabled={blockMutation.isPending || unblockMutation.isPending}
                          className="relative z-10 flex h-[56px] w-full items-center gap-4 rounded-lg px-3 text-left text-[18px] font-bold transition-colors hover:bg-hover disabled:opacity-50"
                        >
                          <Ban className="size-5 text-text-secondary" />
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
                <p className="max-w-[740px] whitespace-pre-wrap text-[15px] leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {(profile.websiteUrl || profile.instagramHandle || profile.youtubeHandle || profile.region || profile.gender) && (
                <div className="flex flex-wrap items-center gap-3.5 text-[14px] text-text-secondary">
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
      <div className="relative mb-6 border-b border-elevated">
        <div 
          className="relative flex items-center overflow-x-auto no-scrollbar"
          onMouseLeave={() => setHoveredTabId(null)}
        >
          {/* Sliding Indicator */}
          <div 
            className="absolute bottom-0 h-[2px] bg-text-primary z-10 rounded-full pointer-events-none"
            style={{ 
              left: `${indicatorStyle.left}px`, 
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
              transition: "left 0.3s cubic-bezier(0.25, 1, 0.5, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
            }} 
          />

          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "favorites") setFavoriteSection("posts");
              }}
              className={`relative flex h-11 min-w-[140px] items-center justify-center gap-2 px-5 text-[15px] font-bold transition-colors whitespace-nowrap lg:text-[17px]
                ${visibleActiveTab === tab.id ? "text-text-primary" : "text-text-muted hover:text-text-secondary"}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isBlocked && !isOwnProfile ? null : visibleActiveTab === "favorites" ? (
        <div>
          <div className="mb-6 flex flex-col gap-3 border-b border-elevated sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFavoriteSection("posts")}
                className={`h-10 shrink-0 rounded-md px-3.5 text-[15px] font-bold transition lg:text-[16px] ${
                  favoriteSection === "posts" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Bài đăng {favoriteVideosRes?.pages[0]?.meta?.totalElements ?? favoriteVideos.length}
              </button>
              <button
                type="button"
                onClick={() => setFavoriteSection("collections")}
                className={`h-10 shrink-0 rounded-md px-3.5 text-[15px] font-bold transition lg:text-[16px] ${
                  favoriteSection === "collections" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Bộ sưu tập {collections.length}
              </button>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setFavoriteSection("sounds")}
                  className={`h-10 shrink-0 rounded-md px-3.5 text-[15px] font-bold transition lg:text-[16px] ${
                    favoriteSection === "sounds" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Âm thanh {favoriteSounds.length}
                </button>
              )}
            </div>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsCreateCollectionOpen(true)}
                className="mb-3 flex h-9 w-fit items-center gap-2 rounded-full bg-elevated px-4 text-[14px] font-bold hover:bg-hover sm:mb-0 lg:text-[15px]"
              >
                <PlusCircle className="size-4" />
                Tạo bộ sưu tập mới
              </button>
            )}
          </div>

          {favoriteSection === "posts" && !canViewFavorites ? (
            <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
              <Lock className="mb-4 size-16 opacity-30" />
              <p className="text-xl font-bold">{t("hiddenContent.favoritesTitle")}</p>
              <p className="mt-2 max-w-md text-center text-sm">{t("hiddenContent.favoritesDescription")}</p>
            </div>
          ) : favoriteSection === "posts" ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {isLoadingFavorites ? (
                [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />)
              ) : favoriteVideos.length > 0 ? (
                <>
                  {favoriteVideos.map((video, index) => (
                    <FavoriteVideoTile
                      key={video.id}
                      video={video}
                      href={videoPath(video.username, video.id, { from: "favorites" })}
                      previewActive={activePreviewVideoId === video.id}
                      onPreviewEnter={() => setHoveredPreviewVideoId(video.id)}
                      ref={favoriteVideos.length === index + 1 ? lastVideoRef : undefined}
                    />
                  ))}
                  {isFetchingNextPage && (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={`fetching-fav-next-${i}`} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />
                    ))
                  )}
                </>
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
                  <Lock className="mb-4 size-16 opacity-30" />
                  <p className="text-xl font-bold">{tCollection("emptyFavorites")}</p>
                </div>
              )}
            </div>
          ) : favoriteSection === "sounds" && !isOwnProfile ? (
            <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
              <Lock className="mb-4 size-16 opacity-30" />
              <p className="text-xl font-bold">{tCollection("privateFavorites")}</p>
            </div>
          ) : favoriteSection === "sounds" ? (
            <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
              {isLoadingSounds ? (
                [1, 2, 3, 4].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-lg bg-elevated" />)
              ) : favoriteSounds.length > 0 ? (
                favoriteSounds.map((sound) => (
                  <FavoriteSoundTile key={sound.id} sound={sound} />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
                  <Music className="mb-4 size-16 opacity-30" />
                  <p className="text-xl font-bold">Chưa có âm thanh yêu thích nào</p>
                </div>
              )}
            </div>
          ) : favoriteSection === "collections" ? (
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
          ) : null}
        </div>
      ) : hiddenContent ? (
        <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
          <Lock className="mb-4 size-16 opacity-30" />
          <p className="text-xl font-bold">{hiddenContent.title}</p>
          <p className="mt-2 max-w-md text-center text-sm">{hiddenContent.description}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {isDisplayedLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-elevated animate-pulse lg:rounded-lg" />
            ))
          ) : displayedVideos.length > 0 ? (
            <>
              {displayedVideos.map((video, index) => (
                <FavoriteVideoTile
                  key={video.id}
                  video={video}
                  href={videoPath(video.username, video.id, {
                    from: visibleActiveTab === "liked" ? "liked" : visibleActiveTab === "reposts" ? "reposts" : "profile",
                    profileOwner: visibleActiveTab === "reposts" ? profile.username : undefined,
                  })}
                  previewActive={activePreviewVideoId === video.id}
                  onPreviewEnter={() => setHoveredPreviewVideoId(video.id)}
                  ref={displayedVideos.length === index + 1 ? lastVideoRef : undefined}
                />
              ))}
              {isFetchingNextPage && (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={`fetching-main-next-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-elevated animate-pulse lg:rounded-lg" />
                ))
              )}
            </>
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
