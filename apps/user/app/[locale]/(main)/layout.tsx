"use client";

import { useSyncExternalStore } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Video,
  X,
  TrendingUp,
  Compass,
  MessageSquare,
  MoreHorizontal,
  PlusSquare,
  User,
  Clock,
  UserCheck,
  Upload,
  Bell,
  Play,
  Heart,
  UserPlus,
  Circle,
  BellOff,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useLogoutMutation } from "@/hooks/auth-hooks";
import { useFollowingList } from "@/hooks/user-hooks";
import { useAllVideos } from "@/hooks/video-hooks";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useMemo } from "react";
import { videoPath } from "@/utils/video-url";

import {
  SearchRow,
  TikNavItem,
  BottomNav,
  HomeIcon,
  labelStyle,
  Logo,
} from "@/components/layout/LayoutHelpers";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { CommentSidebarProvider } from "@/components/layout/CommentSidebarContext";
import CommentSection from "@/components/video/CommentSection";
import { Avatar, Button } from "@repo/ui";
import { useMarkReadMutation, useNotifications, useUnreadCount } from "@/hooks/notification-hooks";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import type { Notification } from "@/types/notification";
import { ConversationList } from "@/components/chat/ConversationList";

const SIDE_PANEL_WIDTH = 400;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Main");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<number | null>(
    null,
  );
  const [activeCommentAllowComments, setActiveCommentAllowComments] = useState(true);

  const commentReturnUrlRef = useRef<string | null>(null);
  const isCommentDetailUrlRef = useRef(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data || 0;
  const { data: notificationsData, isLoading: isNotificationsLoading } = useNotifications();
  const markRead = useMarkReadMutation();
  const notifications = notificationsData?.data || [];
  const dateLocale = pathname.startsWith("/en") ? enUS : vi;

  const { data: followingData } = useFollowingList();
  const followingList = followingData?.data || [];

  const { data: searchVideosData } = useAllVideos();
  const normalizedQuery = query.trim().toLowerCase();

  const isBaseCommentRoute =
    pathname === "/" ||
    pathname === "/explore" ||
    pathname === "/following" ||
    pathname === "/friends";

  const isCommentSidebarAvailable = isBaseCommentRoute;

  const visibleCommentVideoId = isCommentSidebarAvailable
    ? activeCommentVideoId
    : null;

  const shouldShowHeaderOverlay =
    !pathname.includes("/collection/") && !pathname.includes("/video/");
  const isMessagesRoute = pathname === "/messages";
  const selectedConversationParam = Number(searchParams.get("conversation"));
  const selectedConversationId = Number.isFinite(selectedConversationParam)
    ? selectedConversationParam
    : undefined;

  const videoSearchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return (searchVideosData?.data ?? [])
      .filter((videoItem) => {
        const haystack = [
          videoItem.title,
          videoItem.description,
          videoItem.username,
          videoItem.userNickname,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [normalizedQuery, searchVideosData?.data]);

  const syncCommentUrl = useCallback(
    (detailPath?: string, replace = false) => {
      if (!detailPath || typeof window === "undefined") return;

      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentUrl === detailPath) return;

      const returnUrl = commentReturnUrlRef.current ?? currentUrl;
      commentReturnUrlRef.current = returnUrl;
      isCommentDetailUrlRef.current = true;

      const state = {
        ...(window.history.state ?? {}),
        commentSidebar: true,
        commentReturnUrl: returnUrl,
      };

      if (replace) {
        window.history.replaceState(state, "", detailPath);
      } else {
        window.history.pushState(state, "", detailPath);
      }
    },
    [],
  );

  const openCommentSidebar = useCallback(
    (videoId: number, detailPath?: string, allowComments = true) => {
      if (!isCommentSidebarAvailable && !isBaseCommentRoute) return;

      syncCommentUrl(detailPath, activeCommentVideoId !== null);
      setActiveCommentVideoId(videoId);
      setActiveCommentAllowComments(allowComments);
    },
    [
      activeCommentVideoId,
      isBaseCommentRoute,
      isCommentSidebarAvailable,
      syncCommentUrl,
    ],
  );

  const closeCommentSidebar = useCallback(() => {
    if (
      isCommentDetailUrlRef.current &&
      typeof window !== "undefined" &&
      window.history.state?.commentSidebar
    ) {
      window.history.back();
      return;
    }

    setActiveCommentVideoId(null);
    setActiveCommentAllowComments(true);
    commentReturnUrlRef.current = null;
    isCommentDetailUrlRef.current = false;
  }, []);

  const toggleCommentSidebar = useCallback(
    (videoId: number, detailPath?: string, allowComments = true) => {
      if (!isCommentSidebarAvailable && !isBaseCommentRoute) return;

      if (activeCommentVideoId === videoId) {
        closeCommentSidebar();
        return;
      }

      syncCommentUrl(detailPath, activeCommentVideoId !== null);
      setActiveCommentVideoId(videoId);
      setActiveCommentAllowComments(allowComments);
    },
    [
      activeCommentVideoId,
      closeCommentSidebar,
      isBaseCommentRoute,
      isCommentSidebarAvailable,
      syncCommentUrl,
    ],
  );

  useEffect(() => {
    const handlePopState = () => {
      setActiveCommentVideoId(null);
      setActiveCommentAllowComments(true);
      commentReturnUrlRef.current = null;
      isCommentDetailUrlRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const commentSidebarValue = useMemo(
    () => ({
      activeVideoId: isCommentSidebarAvailable ? activeCommentVideoId : null,
      activeVideoAllowComments: activeCommentAllowComments,
      isCommentSidebarAvailable,
      openCommentSidebar,
      toggleCommentSidebar,
      closeCommentSidebar,
    }),
    [
      activeCommentVideoId,
      activeCommentAllowComments,
      isCommentSidebarAvailable,
      openCommentSidebar,
      toggleCommentSidebar,
      closeCommentSidebar,
    ],
  );

  function useIsMounted() {
    return useSyncExternalStore(
      () => () => {},
      () => true,
      () => false,
    );
  }

  const mounted = useIsMounted();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const closeActivity = () => {
    setActivityOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearch();
        closeActivity();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  const isPanelRoute = isMessagesRoute || pathname === "/activity";
  const sidebarRail = mounted ? isSidebarCollapsed || searchOpen || activityOpen || isPanelRoute : false;
  const sidebarWidth = sidebarRail ? 72 : 240;
  const collapsed = sidebarRail;
  const overlayPanelOpen = searchOpen || activityOpen;
  const messagePanelOpen = isMessagesRoute && !searchOpen && !activityOpen;
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 fill-brand text-brand" />;
      case "COMMENT":
        return <MessageSquare className="h-4 w-4 fill-blue-500 text-blue-500" />;
      case "FOLLOW":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <CommentSidebarProvider value={commentSidebarValue}>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-text-primary">
        <header className="sm:hidden flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-elevated bg-background/80 px-4 pt-safe backdrop-blur-md z-20">
          <Link href="/">
            <div className="flex flex-shrink-0 items-center gap-2">
              <Logo size="sm" />
              <span className="text-[18px] font-bold tracking-tight">
                TopTop
              </span>
            </div>
          </Link>

          <div className="ml-2 flex h-[38px] flex-1 items-center gap-2 rounded-full bg-elevated px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <input
              type="text"
              placeholder={t("search")}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          {!isLoggedIn && (
            <Button
              onClick={() => dispatch(openAuthModal("login"))}
              size="sm"
              className="ml-2 h-9 px-4"
            >
              {t("login")}
            </Button>
          )}
        </header>

        <div className="relative flex min-w-0 flex-1 overflow-hidden">
          <aside
            className="hidden h-full flex-shrink-0 select-none flex-col bg-background sm:flex"
            style={{
              width: sidebarWidth,
              minWidth: sidebarWidth,
              transition:
                "width 300ms cubic-bezier(0.4,0,0.2,1), min-width 300ms cubic-bezier(0.4,0,0.2,1)",
              overflow: "hidden",
              position: "relative",
              zIndex: 90,
            }}
          >
            <div
              className="flex h-full flex-col overflow-y-auto overflow-x-hidden no-scrollbar"
              style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                transition:
                  "width 300ms cubic-bezier(0.4,0,0.2,1), min-width 300ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div className="sticky top-0 z-20 flex-shrink-0 bg-background">
                <div
                  className="flex items-center pt-6 pb-3"
                  style={{
                    paddingLeft: collapsed ? 0 : 20,
                    paddingRight: collapsed ? 0 : 20,
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  <Logo size="md" />
                  <span
                    className="whitespace-nowrap text-xl font-bold tracking-tight"
                    style={labelStyle(collapsed, 180, 4)}
                  >
                    TopTop
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActivityOpen(false);
                    setSearchOpen(!searchOpen);
                  }}
                  className={`group mb-4 flex items-center rounded-full border transition-all ${
                    searchOpen
                      ? "border-brand/30 bg-brand/10"
                      : "border-elevated/50 bg-elevated/30 hover:bg-elevated/50"
                  }`}
                  style={{
                    height: 38,
                    width: collapsed ? 48 : "calc(100% - 32px)",
                    marginLeft: collapsed ? 12 : 16,
                    marginRight: collapsed ? 12 : 16,
                    paddingLeft: collapsed ? 0 : 10,
                    paddingRight: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    overflow: "hidden",
                  }}
                >
                  <Search
                    className={`h-[18px] w-[18px] flex-shrink-0 ${
                      searchOpen ? "text-brand" : "text-text-secondary group-hover:text-text-primary"
                    }`}
                    strokeWidth={2.5}
                  />
                  <span
                    className={`pl-2 text-start text-[14px] font-medium text-text-muted whitespace-nowrap ${
                      !collapsed ? "block" : "hidden"
                    }`}
                    style={labelStyle(collapsed, 150, 1)}
                  >
                    {t("search")}
                  </span>
                </button>
              </div>

              <nav
                className="flex flex-col"
                style={{
                  width: sidebarWidth,
                  paddingLeft: collapsed ? 0 : 4,
                  paddingRight: collapsed ? 0 : 4,
                  alignItems: collapsed ? "center" : "stretch",
                }}
              >
                <Link href="/" className={collapsed ? "w-[72px]" : "w-full"}>
                  <TikNavItem
                    icon={<HomeIcon size={24} />}
                    label={t("sidebar.forYou")}
                    active={!overlayPanelOpen && pathname === "/"}
                    collapsed={collapsed}
                  />
                </Link>

                <Link
                  href="/explore"
                  className={collapsed ? "w-[72px]" : "w-full"}
                >
                  <TikNavItem
                    icon={<Compass size={24} />}
                    label={t("sidebar.explore")}
                    active={!overlayPanelOpen && pathname === "/explore"}
                    collapsed={collapsed}
                  />
                </Link>

                <Link
                  href="/following"
                  className={collapsed ? "w-[72px]" : "w-full"}
                >
                  <TikNavItem
                    icon={<UserCheck size={24} />}
                    label={t("sidebar.following")}
                    active={!overlayPanelOpen && pathname === "/following"}
                    collapsed={collapsed}
                  />
                </Link>

                {isLoggedIn && (
                  <Link
                    href="/friends"
                    className={collapsed ? "w-[72px]" : "w-full"}
                  >
                    <TikNavItem
                      icon={<Users size={24} />}
                      label={t("sidebar.friends")}
                      active={!overlayPanelOpen && pathname === "/friends"}
                      collapsed={collapsed}
                    />
                  </Link>
                )}

                <Link
                  href="/live"
                  className={collapsed ? "w-[72px]" : "w-full"}
                >
                  <TikNavItem
                  icon={<Video size={24} />}
                  label={t("sidebar.live")}
                  active={!overlayPanelOpen && pathname === "/live"}
                  collapsed={collapsed}
                />
                </Link>

                {isLoggedIn && (
                  <>
                    <Link
                      href="/messages"
                      onClick={() => {
                        closeSearch();
                        closeActivity();
                      }}
                      className={collapsed ? "w-[72px]" : "w-full"}
                    >
                      <TikNavItem
                        icon={
                          <div className="relative">
                            <MessageSquare size={24} />
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-background bg-brand text-[9px] font-bold text-white">
                              1
                            </span>
                          </div>
                        }
                        label={t("sidebar.messages")}
                        active={messagePanelOpen}
                        collapsed={collapsed}
                      />
                    </Link>

                    <div className={collapsed ? "w-[72px]" : "w-full"}>
                      <TikNavItem
                        onClick={() => {
                          setSearchOpen(false);
                          setActivityOpen((open) => !open);
                        }}
                        icon={
                          <div className="relative">
                            <Bell size={24} />
                            {unreadCount > 0 && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-background bg-brand text-[9px] font-bold text-white">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        }
                        label={t("sidebar.activity")}
                        active={activityOpen || (!overlayPanelOpen && pathname === "/activity")}
                        collapsed={collapsed}
                      />
                    </div>
                  </>
                )}

                <Link
                  href="/toptopstudio/upload"
                  className={collapsed ? "w-[72px]" : "w-full"}
                >
                  <TikNavItem
                        icon={<PlusSquare size={24} />}
                        label={t("sidebar.upload")}
                    active={!overlayPanelOpen && pathname === "/toptopstudio/upload"}
                    collapsed={collapsed}
                  />
                </Link>

                <div className={collapsed ? "w-[72px]" : "w-full"}>
                  <TikNavItem
                    onClick={() => {
                      if (isLoggedIn && user) {
                        router.push(`/@${user.username}`);
                      } else {
                        dispatch(openAuthModal("login"));
                      }
                    }}
                    active={!overlayPanelOpen && Boolean(user) && pathname === `/@${user?.username}`}
                    icon={
                      <Avatar
                        src={user?.avatarUrl}
                        alt={user?.nickname ?? user?.username ?? "U"}
                        size="xs"
                        showBorder={false}
                        className={!isLoggedIn ? "bg-surface" : ""}
                      />
                    }
                    label={t("sidebar.profile")}
                    collapsed={collapsed}
                  />
                </div>
              </nav>

              <div
                className="mt-4 border-t border-elevated"
                style={{
                  opacity: collapsed ? 0 : 1,
                  transition: "opacity 200ms ease",
                  pointerEvents: collapsed ? "none" : "auto",
                  width: 240,
                }}
              >
                {isLoggedIn ? (
                  <>
                    <p className="px-4 pb-2 pt-5 text-[13px] font-bold uppercase tracking-tight text-text-muted opacity-70">
                      {t("sidebar.followingAccounts")}
                    </p>

                    <ul className="flex flex-col px-1 pb-4">
                      {followingList.map((u) => (
                        <li key={u.username}>
                          <button
                            onClick={() => router.push(`/@${u.username}`)}
                            className="group flex w-full items-center gap-3 rounded-[8px] px-3 py-1.5 text-left transition-colors hover:bg-hover"
                          >
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                              <Avatar
                                src={u.avatarUrl}
                                alt={u.nickname || u.username || ""}
                                size="sm"
                                showBorder={false}
                              />
                            </div>

                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-[15px] font-bold leading-tight text-text-primary">
                                {u.nickname ?? u.username}
                              </span>
                              <span className="truncate text-[12px] leading-tight text-text-muted transition-colors group-hover:text-text-secondary">
                                {u.username}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}

                      {followingList.length === 0 && (
                        <li className="px-5 py-2 text-[13px] italic text-text-muted">
                          {t("sidebar.noFollowing")}
                        </li>
                      )}

                      {followingList.length > 5 && (
                        <li>
                          <button className="group mt-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-[14px] font-bold text-brand transition-colors hover:bg-hover">
                            <span className="flex h-8 w-8 items-center justify-center text-brand">
                              <MoreHorizontal
                                className="h-4 w-4 transition-transform group-hover:scale-110"
                                strokeWidth={3}
                              />
                            </span>
                            {t("sidebar.seeAll")}
                          </button>
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="mx-4 mb-4 mt-6 rounded-xl border border-elevated bg-elevated/30 p-4">
                      <p className="mb-4 text-[14px] font-medium leading-relaxed text-text-secondary">
                        {t("sidebar.loginPrompt")}
                      </p>
                      <Button
                        onClick={() => dispatch(openAuthModal("login"))}
                        className="h-12 w-full text-lg"
                      >
                        {t("login")}
                      </Button>
                    </div>

                    <div className="mt-6 px-4 pb-6">
                      <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 opacity-60">
                        {[
                          t("footer.company"),
                          t("footer.programs"),
                          t("footer.terms"),
                          t("footer.privacy"),
                        ].map((label) => (
                          <span
                            key={label}
                            className="cursor-pointer text-[12px] font-medium text-text-muted hover:underline"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <span className="text-[12px] font-medium text-text-muted opacity-50">
                        © 2026 TopTop
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>

          <div
            className="absolute inset-y-0 hidden flex-col border-r border-elevated bg-background shadow-2xl lg:flex"
            style={{
              left: sidebarWidth,
              width: searchOpen ? SIDE_PANEL_WIDTH : 0,
              opacity: searchOpen ? 1 : 0,
              pointerEvents: searchOpen ? "auto" : "none",
              overflow: "hidden",
              zIndex: 80,
              transition:
                "left 300ms cubic-bezier(0.4,0,0.2,1), width 300ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease",
            }}
          >
            <div className="h-full w-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex h-full flex-col gap-6 p-6">
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="flex-1 text-[22px] font-extrabold">
                    {t("searchPanel.title")}
                  </h2>
                  <button
                    onClick={closeSearch}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex h-[48px] items-center gap-3 rounded-full bg-surface px-4 ring-1 ring-transparent transition-all focus-within:ring-brand/40">
                  <Search className="h-5 w-5 flex-shrink-0 text-text-muted" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="flex-shrink-0 text-text-muted hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {normalizedQuery ? (
                  <section>
                    <span className="mb-3 block px-1 text-[12px] font-bold uppercase tracking-widest text-text-muted">
                      Video
                    </span>

                    <div className="flex flex-col gap-2">
                      {videoSearchResults.length > 0 ? (
                        videoSearchResults.map((videoItem) => (
                          <button
                            key={videoItem.id}
                            type="button"
                            onClick={() => {
                              closeSearch();
                              router.push(
                                videoPath(videoItem.username, videoItem.id, {
                                  from: "search",
                                }),
                              );
                            }}
                            className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-hover"
                          >
                            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-elevated">
                              <Image
                                src={videoItem.thumbnailUrl || videoItem.fileUrl}
                                alt={videoItem.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[10px] font-bold text-white">
                                <Play className="size-3 fill-white" />
                                {videoItem.viewCount}
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[14px] font-bold leading-snug">
                                {videoItem.title}
                              </p>
                              <p className="mt-1 truncate text-[12px] font-semibold text-text-muted">
                                @{videoItem.username}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="px-2 py-8 text-center text-[14px] font-semibold text-text-muted">
                          Không tìm thấy video phù hợp.
                        </p>
                      )}
                    </div>
                  </section>
                ) : (
                  <section>
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-text-muted">
                        {t("searchPanel.recent")}
                      </span>
                      <button className="text-[13px] font-semibold text-brand hover:underline">
                        {t("searchPanel.clearAll")}
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <SearchRow
                        icon={<Clock className="h-4 w-4" />}
                        label="trending"
                        removable
                      />
                      <SearchRow
                        icon={<Clock className="h-4 w-4" />}
                        label="cats"
                        removable
                      />
                    </div>
                  </section>
                )}

                <section>
                  <span className="mb-3 block px-1 text-[12px] font-bold uppercase tracking-widest text-text-muted">
                    {t("searchPanel.suggestions")}
                  </span>

                  <div className="flex flex-col gap-1">
                    <SearchRow
                      icon={<TrendingUp className="h-4 w-4 text-brand" />}
                      label="viral"
                    />
                    <SearchRow
                      icon={<TrendingUp className="h-4 w-4 text-brand" />}
                      label="challenge"
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-y-0 hidden flex-col border-r border-elevated bg-background shadow-2xl lg:flex"
            style={{
              left: sidebarWidth,
              width: messagePanelOpen ? SIDE_PANEL_WIDTH : 0,
              opacity: messagePanelOpen ? 1 : 0,
              pointerEvents: messagePanelOpen ? "auto" : "none",
              overflow: "hidden",
              zIndex: 80,
              transition:
                "left 300ms cubic-bezier(0.4,0,0.2,1), width 300ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease",
            }}
          >
            <div className="h-full w-[400px] overflow-hidden">
              <ConversationList
                selectedId={selectedConversationId}
                onSelect={(id) => router.push(`/messages?conversation=${id}`)}
              />
            </div>
          </div>

          <div
            className="absolute inset-y-0 hidden flex-col border-r border-elevated bg-background shadow-2xl lg:flex"
            style={{
              left: sidebarWidth,
              width: activityOpen ? SIDE_PANEL_WIDTH : 0,
              opacity: activityOpen ? 1 : 0,
              pointerEvents: activityOpen ? "auto" : "none",
              overflow: "hidden",
              zIndex: 80,
              transition:
                "left 300ms cubic-bezier(0.4,0,0.2,1), width 300ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease",
            }}
          >
            <div className="h-full w-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex min-h-full flex-col p-6">
                <div className="mb-5 mt-2 flex items-center gap-2">
                  <h2 className="flex-1 text-[22px] font-extrabold">
                    {t("sidebar.activity")}
                  </h2>
                  <button
                    onClick={closeActivity}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {isNotificationsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="h-12 w-12 rounded-full bg-elevated" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded bg-elevated w-3/4" />
                          <div className="h-3 rounded bg-elevated w-1/4" />
                        </div>
                      </div>
                    ))
                  ) : notifications.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/30">
                        <BellOff className="h-10 w-10 text-text-muted" />
                      </div>
                      <p className="font-medium text-text-secondary">
                        {t("notifications.empty")}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification: Notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`group flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                          notification.isRead
                            ? "opacity-70 hover:opacity-100 hover:bg-hover"
                            : "bg-brand/5 hover:bg-brand/10"
                        }`}
                        onClick={() => {
                          if (!notification.isRead) markRead.mutate(notification.id);
                        }}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={notification.actorAvatarUrl}
                            alt={notification.actorUsername}
                            size="lg"
                          />
                          <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 shadow-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-[15px] leading-tight">
                            <span className="font-bold group-hover:underline">
                              @{notification.actorUsername}
                            </span>
                            {" "}
                            {notification.content}
                          </p>
                          <p className="text-[13px] text-text-muted">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </p>
                        </div>

                        {notification.videoId && notification.videoThumbnailUrl && (
                          <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md border border-elevated bg-black">
                            <Image
                              src={notification.videoThumbnailUrl}
                              alt="Video thumbnail"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {shouldShowHeaderOverlay && (
            <div className="fixed right-4 top-3 z-[60] flex items-center gap-3 transition-all duration-300 lg:right-6 lg:top-4">
              <div className="relative">
                <div className="flex items-center gap-2 rounded-2xl border border-elevated bg-background/60 px-2.5 py-1.5 shadow-2xl backdrop-blur-xl transition-colors hover:bg-background/80 lg:px-3 lg:py-2">
                  {mounted && isLoggedIn && user ? (
                    <div
                      className="flex cursor-pointer items-center gap-2 lg:gap-3"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                      <div className="group flex items-center gap-2 lg:gap-2.5">
                        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-brand/20 bg-elevated shadow-inner transition-all group-hover:border-brand/50 lg:h-9 lg:w-9">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.nickname ?? ""}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[14px] font-bold text-brand">
                              {(
                                user.nickname ??
                                user.username ??
                                "U"
                              )[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* <span className="hidden text-[14px] font-bold text-text-primary transition-colors group-hover:text-brand sm:block lg:text-[15px]">
                          {user.nickname ?? user.username}
                        </span> */}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => dispatch(openAuthModal("login"))}
                        size="sm"
                        className="h-9 rounded-xl px-6"
                      >
                        {t("login")}
                      </Button>

                      <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {settingsOpen && (
                  <div
                    ref={settingsMenuRef}
                    className="absolute right-0 top-full z-[70] mt-2"
                  >
                    <SettingsMenu
                      onClose={() => setSettingsOpen(false)}
                      onLogout={
                        isLoggedIn
                          ? () => {
                              logoutMutation.mutate();
                              setSettingsOpen(false);
                            }
                          : undefined
                      }
                      isLoggedIn={isLoggedIn}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <main
            className="relative min-w-0 flex-1 overflow-hidden bg-background"
            style={{
              marginLeft: isMessagesRoute ? SIDE_PANEL_WIDTH : 0,
              transition: "margin-left 300ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div className="relative h-full w-full">{children}</div>
          </main>

          <aside
            className="relative z-[70] hidden h-full flex-shrink-0 overflow-hidden border-l border-elevated bg-background shadow-2xl transition-all duration-300 md:flex"
            style={{
              width: visibleCommentVideoId ? 420 : 0,
              minWidth: visibleCommentVideoId ? 420 : 0,
              opacity: visibleCommentVideoId ? 1 : 0,
              pointerEvents: visibleCommentVideoId ? "auto" : "none",
            }}
          >
            <div className="h-full w-[420px] flex-shrink-0 overflow-hidden">
              {visibleCommentVideoId && (
                <CommentSection
                  key={visibleCommentVideoId}
                  videoId={visibleCommentVideoId}
                  allowComments={activeCommentAllowComments}
                  onClose={closeCommentSidebar}
                  embedded
                />
              )}
            </div>
          </aside>
        </div>

        {visibleCommentVideoId && (
          <div
            className="fixed inset-0 z-[80] bg-black/40 md:hidden"
            onClick={closeCommentSidebar}
          >
            <div
              className="absolute inset-y-0 right-0 w-[min(420px,100vw)] overflow-hidden border-l border-elevated bg-background shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <CommentSection
                key={visibleCommentVideoId}
                videoId={visibleCommentVideoId}
                allowComments={activeCommentAllowComments}
                onClose={closeCommentSidebar}
                embedded
              />
            </div>
          </div>
        )}

        <nav className="sm:hidden flex h-[64px] flex-shrink-0 items-center justify-around border-t border-elevated bg-background/90 pb-safe backdrop-blur-md z-20">
          <Link href="/">
            <BottomNav
              icon={<HomeIcon size={26} />}
              label={t("sidebar.forYou")}
              active={pathname === "/"}
            />
          </Link>

          <Link href="/explore">
            <BottomNav
              icon={<Compass className="h-[26px] w-[26px]" />}
              label={t("sidebar.explore")}
              active={pathname === "/explore"}
            />
          </Link>

          <Link href="/toptopstudio/upload">
            <BottomNav
              icon={<Upload className="h-[26px] w-[26px]" />}
              label={t("sidebar.upload")}
              active={pathname === "/toptopstudio/upload"}
            />
          </Link>

          <Link href="/friends">
            <BottomNav
              icon={<Users className="h-[26px] w-[26px]" />}
              label={t("bottomNav.friends")}
              active={pathname === "/friends"}
            />
          </Link>

          <BottomNav
            active={user ? pathname === `/@${user.username}` : false}
            onClick={() => {
              if (isLoggedIn && user) {
                router.push(`/@${user.username}`);
              } else {
                dispatch(openAuthModal("login"));
              }
            }}
            icon={
              isLoggedIn && user?.avatarUrl ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-full border border-elevated">
                  <Image
                    src={user.avatarUrl}
                    alt={user.nickname ?? ""}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : isLoggedIn && user ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-[11px] font-bold text-brand">
                  {(user.nickname ?? user.username ?? "U")[0].toUpperCase()}
                </div>
              ) : (
                <User className="h-[26px] w-[26px]" />
              )
            }
            label={t("sidebar.profile")}
          />
        </nav>
      </div>
    </CommentSidebarProvider>
  );
}
