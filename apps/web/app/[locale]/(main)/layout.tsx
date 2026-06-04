"use client";

import { useSyncExternalStore } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Video,
  X,
  Compass,
  MessageSquare,
  MoreHorizontal,
  PlusSquare,
  User,
  UserCheck,
  Upload,
  Bell,
  Heart,
  UserPlus,
  Circle,
  BellOff,
  AtSign,
  Tag,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useLogoutMutation } from "@/hooks/auth-hooks";
import { useFollowingList } from "@/hooks/user-hooks";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useMemo } from "react";

import {
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
import { useChatUnreadCount } from "@/hooks/chat-hooks";
import type { ConversationStatus } from "@/types/chat";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useFriendsCount } from "@/hooks/friend-hooks";
import { useMyLivestreams } from "@/hooks/live-hooks";

const SIDE_PANEL_WIDTH = 360;
const COMMENT_SIDEBAR_WIDTH = 360;
const SIDEBAR_EXPANDED_WIDTH = 240;
const FEED_DETAIL_SIDEBAR_EXPANDED_WIDTH = 220;
type NotificationFilter = "ALL" | "LIKE" | "COMMENT" | "MENTION_TAG" | "FOLLOW";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Main");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("ALL");
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

  const { data: unreadData } = useUnreadCount(isLoggedIn);
  const unreadCount = unreadData?.data || 0;
  const { data: chatUnreadData } = useChatUnreadCount(isLoggedIn);
  const chatUnreadCount = chatUnreadData?.data
    ? chatUnreadData.data.totalUnread + chatUnreadData.data.requestUnread
    : 0;
  const { data: myLivestreamsData } = useMyLivestreams(isLoggedIn);
  const { data: notificationsData, isLoading: isNotificationsLoading } = useNotifications(isLoggedIn);
  const markRead = useMarkReadMutation();
  const notifications = notificationsData?.data || [];
  const dateLocale = pathname.startsWith("/en") ? enUS : vi;

  const getGroupedNotifications = (items: Notification[]) => {
    const today: Notification[] = [];
    const thisWeek: Notification[] = [];
    const thisMonth: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    items.forEach((item) => {
      const time = new Date(item.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(item);
      } else if (time >= oneWeekAgo) {
        thisWeek.push(item);
      } else if (time >= oneMonthAgo) {
        thisMonth.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, thisWeek, thisMonth, earlier };
  };

  const groupLabels = {
    today: t("notifications.today"),
    thisWeek: t("notifications.thisWeek"),
    thisMonth: t("notifications.thisMonth"),
    earlier: t("notifications.earlier")
  };

  const notificationMatchesFilter = (notification: Notification, filter: NotificationFilter) => {
    const type = notification.type?.toUpperCase();
    if (filter === "ALL") return true;
    if (filter === "LIKE") return type === "LIKE" || type === "VIDEO_LIKE";
    if (filter === "COMMENT") return type === "COMMENT" || type === "REPLY" || type === "COMMENT_REPLY";
    if (filter === "FOLLOW") return type === "FOLLOW";
    return ["MENTION", "TAG", "MENTION_TAG", "USER_MENTION", "VIDEO_TAG", "COMMENT_MENTION"].includes(type);
  };

  const activeHostedLivestream = useMemo(() => {
    const streams = myLivestreamsData?.data ?? [];
    return (
      streams.find((stream) => stream.status === "LIVE") ??
      streams.find((stream) => stream.status === "SCHEDULED") ??
      null
    );
  }, [myLivestreamsData?.data]);
  const liveHref = activeHostedLivestream
    ? `/lives/studio/${activeHostedLivestream.id}`
    : "/lives";

  const notificationFilters: { key: NotificationFilter; label: string }[] = [
    { key: "ALL", label: t("notifications.filters.all") },
    { key: "LIKE", label: t("notifications.filters.likes") },
    { key: "COMMENT", label: t("notifications.filters.comments") },
    { key: "MENTION_TAG", label: t("notifications.filters.mentionsTags") },
    { key: "FOLLOW", label: t("notifications.filters.followers") },
  ];

  const filteredNotifications = notifications.filter((notification) =>
    notificationMatchesFilter(notification, notificationFilter),
  );
  const groupedNotifications = getGroupedNotifications(filteredNotifications);

  const { data: followingData } = useFollowingList(isLoggedIn);
  const followingList = followingData?.data || [];
  const { data: friendsCountData } = useFriendsCount(isLoggedIn);
  const hasFriends = (friendsCountData?.data ?? 0) > 0;

  const isBaseCommentRoute =
    pathname === "/" ||
    pathname === "/explore" ||
    pathname === "/following" ||
    (hasFriends && pathname === "/friends");

  const isCommentSidebarAvailable = isBaseCommentRoute;

  const visibleCommentVideoId = isCommentSidebarAvailable
    ? activeCommentVideoId
    : null;

  const currentSearchQuery = pathname === "/search" ? searchParams.get("q")?.trim() ?? "" : "";
  const isFeedDirectDetailRoute =
    pathname.includes("/video/") &&
    (!searchParams.get("from") || searchParams.get("from") === "feed");
  const isMessagesRoute = pathname === "/messages";
  const shouldShowHeaderOverlay =
    !isMessagesRoute && !pathname.includes("/collection/") && !pathname.includes("/video/");
  const messageView = searchParams.get("view") === "requests" ? "requests" : "inbox";
  const selectedConversationParam = Number(searchParams.get("conversation"));
  const selectedConversationId = Number.isFinite(selectedConversationParam)
    ? selectedConversationParam
    : undefined;

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
  const expandedSidebarWidth = isFeedDirectDetailRoute
    ? FEED_DETAIL_SIDEBAR_EXPANDED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;
  const sidebarWidth = sidebarRail ? 72 : expandedSidebarWidth;
  const collapsed = sidebarRail;
  const overlayPanelOpen = searchOpen || activityOpen;
  const messagePanelOpen = isMessagesRoute && !searchOpen && !activityOpen;

  const getLocalizedNotificationContent = (notification: Notification) => {
    const { type, content, actorUsername } = notification;
    
    let cleanContent = content;
    if (actorUsername && content.startsWith(actorUsername)) {
      cleanContent = content.substring(actorUsername.length).trim();
    }

    switch (type) {
      case "LIKE": {
        const colonIndex = cleanContent.indexOf(":");
        if (colonIndex !== -1) {
          const videoTitle = cleanContent.substring(colonIndex + 1).trim();
          return `${t("notifications.liked")}: ${videoTitle}`;
        }
        return t("notifications.liked");
      }
      case "COMMENT": {
        const colonIndex = cleanContent.indexOf(":");
        if (colonIndex !== -1) {
          const commentContent = cleanContent.substring(colonIndex + 1).trim();
          return `${t("notifications.commented")}: ${commentContent}`;
        }
        return t("notifications.commented");
      }
      case "FOLLOW": {
        return t("notifications.followed");
      }
      case "MENTION":
      case "USER_MENTION":
      case "COMMENT_MENTION": {
        return t("notifications.mentioned");
      }
      case "TAG":
      case "VIDEO_TAG":
      case "MENTION_TAG": {
        return t("notifications.tagged");
      }
      default:
        return cleanContent;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 fill-brand text-brand" />;
      case "COMMENT":
        return <MessageSquare className="h-4 w-4 fill-blue-500 text-blue-500" />;
      case "FOLLOW":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case "MENTION":
      case "USER_MENTION":
      case "COMMENT_MENTION":
        return <AtSign className="h-4 w-4 text-cyan-500" />;
      case "TAG":
      case "VIDEO_TAG":
      case "MENTION_TAG":
        return <Tag className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    setSearchOpen(false);
    setActivityOpen(false);
    setSettingsOpen(false);
  }, [pathname]);

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
                <Link
                  href="/"
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
                </Link>

                <button
                  onClick={() => {
                    setActivityOpen(false);
                    if (!searchOpen && currentSearchQuery) {
                      setQuery(currentSearchQuery);
                    }
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
                    {currentSearchQuery || t("search")}
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

                {hasFriends && (
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
                  href={liveHref}
                  onClick={() => {
                    closeSearch();
                    closeActivity();
                  }}
                  className={collapsed ? "w-[72px]" : "w-full"}
                >
                  <TikNavItem
                    icon={<Video size={24} />}
                    label={t("sidebar.live")}
                    active={
                      !overlayPanelOpen &&
                      (pathname === "/lives" || pathname.startsWith("/lives/studio"))
                    }
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
                            {chatUnreadCount > 0 && (
                              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-background bg-brand px-1 text-[9px] font-bold text-white">
                                {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                              </span>
                            )}
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
                  width: expandedSidebarWidth,
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
            <div className="h-full w-[350px] overflow-hidden">
              <SearchOverlay
                query={query}
                setQuery={setQuery}
                onClose={closeSearch}
                inputRef={searchInputRef}
                isLoggedIn={isLoggedIn}
              />
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
            <div className="h-full w-[350px] overflow-hidden">
              <ConversationList
                selectedId={selectedConversationId}
                view={messageView}
                onViewChange={(view) => {
                  router.push(view === "requests" ? "/messages?view=requests" : "/messages");
                }}
                onSelect={(id, status: ConversationStatus) => {
                  const requestParam = status === "REQUESTED" ? "&view=requests" : "";
                  router.push(`/messages?conversation=${id}${requestParam}`);
                }}
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
            <div className="h-full w-[350px] overflow-y-auto custom-scrollbar">
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

                <div className="mb-4 flex flex-wrap gap-2">
                  {notificationFilters.map((filter) => {
                    const active = notificationFilter === filter.key;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setNotificationFilter(filter.key)}
                        className={`rounded-full px-4 py-2 text-[14px] font-bold transition-colors ${
                          active
                            ? "bg-text-primary text-background"
                            : "bg-elevated/70 text-text-primary hover:bg-hover"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
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
                  ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/30">
                        <BellOff className="h-10 w-10 text-text-muted" />
                      </div>
                      <p className="font-medium text-text-secondary">
                        {t("notifications.empty")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {((title: string, groupItems: Notification[]) => {
                        if (groupItems.length === 0) return null;
                        return (
                          <div className="mb-6">
                            <h3 className="text-[13px] font-bold text-text-secondary px-3 py-1 mb-2 mt-4 uppercase tracking-wider opacity-60">
                              {title}
                            </h3>
                            <div className="flex flex-col gap-1">
                              {groupItems.map((notification: Notification) => (
                                <div
                                  key={notification.id}
                                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/8"
                                  onClick={() => {
                                    if (!notification.isRead) markRead.mutate(notification.id);
                                    if (notification.videoId && user?.username) {
                                      router.push(`/@${user.username}/video/${notification.videoId}`);
                                    } else {
                                      router.push(`/@${notification.actorUsername}`);
                                    }
                                  }}
                                >
                                  <div 
                                    className="relative flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!notification.isRead) markRead.mutate(notification.id);
                                      router.push(`/@${notification.actorUsername}`);
                                    }}
                                  >
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
                                    <p className="mb-1 text-[15px] leading-tight break-words">
                                      <span 
                                        className="font-bold group-hover:underline cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notification.isRead) markRead.mutate(notification.id);
                                          router.push(`/@${notification.actorUsername}`);
                                        }}
                                      >
                                        @{notification.actorUsername}
                                      </span>
                                      {" "}
                                      {getLocalizedNotificationContent(notification)}
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
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })(groupLabels.today, groupedNotifications.today)}

                      {((title: string, groupItems: Notification[]) => {
                        if (groupItems.length === 0) return null;
                        return (
                          <div className="mb-6">
                            <h3 className="text-[13px] font-bold text-text-secondary px-3 py-1 mb-2 mt-4 uppercase tracking-wider opacity-60">
                              {title}
                            </h3>
                            <div className="flex flex-col gap-1">
                              {groupItems.map((notification: Notification) => (
                                <div
                                  key={notification.id}
                                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/8"
                                  onClick={() => {
                                    if (!notification.isRead) markRead.mutate(notification.id);
                                    if (notification.videoId && user?.username) {
                                      router.push(`/@${user.username}/video/${notification.videoId}`);
                                    } else {
                                      router.push(`/@${notification.actorUsername}`);
                                    }
                                  }}
                                >
                                  <div 
                                    className="relative flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!notification.isRead) markRead.mutate(notification.id);
                                      router.push(`/@${notification.actorUsername}`);
                                    }}
                                  >
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
                                    <p className="mb-1 text-[15px] leading-tight break-words">
                                      <span 
                                        className="font-bold group-hover:underline cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notification.isRead) markRead.mutate(notification.id);
                                          router.push(`/@${notification.actorUsername}`);
                                        }}
                                      >
                                        @{notification.actorUsername}
                                      </span>
                                      {" "}
                                      {getLocalizedNotificationContent(notification)}
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
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })(groupLabels.thisWeek, groupedNotifications.thisWeek)}

                      {((title: string, groupItems: Notification[]) => {
                        if (groupItems.length === 0) return null;
                        return (
                          <div className="mb-6">
                            <h3 className="text-[13px] font-bold text-text-secondary px-3 py-1 mb-2 mt-4 uppercase tracking-wider opacity-60">
                              {title}
                            </h3>
                            <div className="flex flex-col gap-1">
                              {groupItems.map((notification: Notification) => (
                                <div
                                  key={notification.id}
                                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/8"
                                  onClick={() => {
                                    if (!notification.isRead) markRead.mutate(notification.id);
                                    if (notification.videoId && user?.username) {
                                      router.push(`/@${user.username}/video/${notification.videoId}`);
                                    } else {
                                      router.push(`/@${notification.actorUsername}`);
                                    }
                                  }}
                                >
                                  <div 
                                    className="relative flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!notification.isRead) markRead.mutate(notification.id);
                                      router.push(`/@${notification.actorUsername}`);
                                    }}
                                  >
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
                                    <p className="mb-1 text-[15px] leading-tight break-words">
                                      <span 
                                        className="font-bold group-hover:underline cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notification.isRead) markRead.mutate(notification.id);
                                          router.push(`/@${notification.actorUsername}`);
                                        }}
                                      >
                                        @{notification.actorUsername}
                                      </span>
                                      {" "}
                                      {getLocalizedNotificationContent(notification)}
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
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })(groupLabels.thisMonth, groupedNotifications.thisMonth)}

                      {((title: string, groupItems: Notification[]) => {
                        if (groupItems.length === 0) return null;
                        return (
                          <div className="mb-6">
                            <h3 className="text-[13px] font-bold text-text-secondary px-3 py-1 mb-2 mt-4 uppercase tracking-wider opacity-60">
                              {title}
                            </h3>
                            <div className="flex flex-col gap-1">
                              {groupItems.map((notification: Notification) => (
                                <div
                                  key={notification.id}
                                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/8"
                                  onClick={() => {
                                    if (!notification.isRead) markRead.mutate(notification.id);
                                    if (notification.videoId && user?.username) {
                                      router.push(`/@${user.username}/video/${notification.videoId}`);
                                    } else {
                                      router.push(`/@${notification.actorUsername}`);
                                    }
                                  }}
                                >
                                  <div 
                                    className="relative flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!notification.isRead) markRead.mutate(notification.id);
                                      router.push(`/@${notification.actorUsername}`);
                                    }}
                                  >
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
                                    <p className="mb-1 text-[15px] leading-tight break-words">
                                      <span 
                                        className="font-bold group-hover:underline cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notification.isRead) markRead.mutate(notification.id);
                                          router.push(`/@${notification.actorUsername}`);
                                        }}
                                      >
                                        @{notification.actorUsername}
                                      </span>
                                      {" "}
                                      {getLocalizedNotificationContent(notification)}
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
                                </div>
                              ))}
\\                            </div>
                          </div>
                        );
                      })(groupLabels.earlier, groupedNotifications.earlier)}
                    </>
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
              width: visibleCommentVideoId ? COMMENT_SIDEBAR_WIDTH : 0,
              minWidth: visibleCommentVideoId ? COMMENT_SIDEBAR_WIDTH : 0,
              opacity: visibleCommentVideoId ? 1 : 0,
              pointerEvents: visibleCommentVideoId ? "auto" : "none",
            }}
          >
            <div
              className="h-full flex-shrink-0 overflow-hidden"
              style={{ width: COMMENT_SIDEBAR_WIDTH }}
            >
              {visibleCommentVideoId && (
                <div className="flex h-full flex-col">
                  <CommentSection
                    key={visibleCommentVideoId}
                    videoId={visibleCommentVideoId}
                    allowComments={activeCommentAllowComments}
                    onClose={closeCommentSidebar}
                    embedded
                    className="border-0"
                  />
                </div>
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
              className="absolute inset-y-0 right-0 overflow-hidden border-l border-elevated bg-background shadow-2xl"
              style={{ width: `min(${COMMENT_SIDEBAR_WIDTH}px, 100vw)` }}
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

          {hasFriends && (
            <Link href="/friends">
              <BottomNav
                icon={<Users className="h-[26px] w-[26px]" />}
                label={t("bottomNav.friends")}
                active={pathname === "/friends"}
              />
            </Link>
          )}

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
