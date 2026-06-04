"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Avatar, Button } from "@repo/ui";
import { CheckCircle2, Loader2, Radio, WifiOff } from "lucide-react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/store/store";
import {
  useFollowLiveHost,
  useJoinLivestream,
  useLeaveStream,
  useLiveSocket,
  useLivestream,
  useSendReaction,
} from "@/hooks/live-hooks";
import type { LivestreamResponse } from "@/types/live";
import FloatingHeartLayer, { type FloatingHeart } from "./FloatingHeartLayer";
import GiftPanel from "./GiftPanel";
import LiveActionRail from "./LiveActionRail";
import LiveChat from "./LiveChat";

const HostVideo = () => {
  const videoTracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]).filter(isTrackReference);

  const screenTrack = videoTracks.find(
    (trackRef) => trackRef.source === Track.Source.ScreenShare,
  );
  const cameraTrack = videoTracks.find(
    (trackRef) => trackRef.source === Track.Source.Camera,
  );
  const activeTrack = screenTrack || cameraTrack;

  if (!activeTrack) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-sm text-white/60">Waiting for host video...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={activeTrack}
      className={`h-full w-full ${
        activeTrack.source === Track.Source.ScreenShare ? "object-contain" : "object-cover"
      }`}
    />
  );
};

interface LiveKitViewerProps {
  streamId: number;
  isActive: boolean;
  initialStream?: LivestreamResponse;
  /**
   * When true (feed /lives page), shows a "Click to join" overlay instead of
   * auto-connecting. Interactions (like, gift, chat) are hidden until the user
   * explicitly taps the join button.
   */
  previewMode?: boolean;
}

export default function LiveKitViewer({
  streamId,
  isActive,
  initialStream,
  previewMode = false,
}: LiveKitViewerProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const t = useTranslations("common");
  const { data: streamInfo, isLoading: isInfoLoading, isError } = useLivestream(streamId);
  const joinMutation = useJoinLivestream();
  const leaveStream = useLeaveStream();
  const sendReaction = useSendReaction();
  const followHost = useFollowLiveHost();

  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [joinError, setJoinError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
  const [chatFocusSignal, setChatFocusSignal] = useState(0);
  const [streamEndedBySocket, setStreamEndedBySocket] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  /** previewMode only: becomes true when user clicks "Click to join" */
  const [userWantsToJoin, setUserWantsToJoin] = useState(false);
  const [joinRetryCount, setJoinRetryCount] = useState(0);

  const hasAttemptedJoin = useRef(false);
  const hasJoinedRef = useRef(false);
  // Keep a stable ref to the mutate fn so the join effect doesn't re-run when
  // the mutation state changes (idle → loading → settled changes the object identity).
  const joinMutateRef = useRef(joinMutation.mutate);
  useEffect(() => {
    joinMutateRef.current = joinMutation.mutate;
  });

  const stream = streamInfo?.data || initialStream;
  const visibleLikeCount = stream?.likeCount || 0;

  // Leave stream and reset all join state when component becomes inactive (e.g. scrolled away)
  useEffect(() => {
    if (!isActive) {
      startTransition(() => {
        setUserWantsToJoin(false);
        setToken("");
        setUrl("");
        setJoinError("");
        setConnectionError("");
        setJoinRetryCount(0);
      });
      hasAttemptedJoin.current = false;
      if (hasJoinedRef.current) {
        leaveStream.mutate(streamId);
        hasJoinedRef.current = false;
      }
    }
  }, [isActive, streamId, leaveStream]);

  // Leave stream on unmount (explicit viewer count decrement)
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        leaveStream.mutate(streamId);
      }
    };
    // We want this to fire once on unmount; leaveStream ref is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const handleStreamEnded = useCallback(() => {
    setStreamEndedBySocket(true);
    setToken("");
    setUrl("");
  }, []);

  // Subscribe to WebSocket events for real-time updates
  useLiveSocket(
    isActive ? streamId : null,
    undefined,
    handleStreamEnded
  );

  const MAX_JOIN_RETRIES = 5;

  // Reset join state when the stream status transitions to LIVE so the viewer
  // automatically connects without a manual reconnect.
  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentStatus = stream?.status;
    if (prevStatusRef.current !== currentStatus) {
      if (currentStatus === "LIVE" && prevStatusRef.current !== undefined) {
        hasAttemptedJoin.current = false;
        setJoinError("");
        setConnectionError("");
      }
      prevStatusRef.current = currentStatus;
    }
  }, [stream?.status]);

  // In preview mode, only start joining after the user opts in.
  // In detail mode, join automatically.
  const shouldAttemptJoin = previewMode ? userWantsToJoin : true;

  useEffect(() => {
    if (
      !isActive ||
      !shouldAttemptJoin ||
      token ||
      hasAttemptedJoin.current ||
      stream?.status !== "LIVE"
    ) return;
    if (joinRetryCount >= MAX_JOIN_RETRIES) return;

    hasAttemptedJoin.current = true;
    joinMutateRef.current(streamId, {
      onSuccess: (res) => {
        if (res.data) {
          setToken(res.data.token);
          setUrl(res.data.livekitUrl);
          setJoinRetryCount(0);
          hasJoinedRef.current = true;
        }
      },
      onError: (error: unknown) => {
        const maybeError = error as { response?: { data?: { message?: string } } };
        const msg = maybeError.response?.data?.message || "Could not join this live stream.";
        setJoinError(msg);
        hasAttemptedJoin.current = false;
        setJoinRetryCount((c) => c + 1);
      },
    });
  // joinMutateRef is stable — safe to exclude from deps
  }, [isActive, shouldAttemptJoin, stream?.status, streamId, token, joinRetryCount]);

  const hostName = useMemo(() => {
    if (!stream?.host) return "Unknown host";
    return stream.host.displayName || stream.host.username;
  }, [stream?.host]);

  const addHeart = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const heart = {
      id,
      offset: Math.floor(Math.random() * 28) - 14,
      size: 30 + Math.floor(Math.random() * 12),
    };
    setHearts((current) => [...current.slice(-10), heart]);
    window.setTimeout(() => {
      setHearts((current) => current.filter((item) => item.id !== id));
    }, 1300);
  };

  const handleLike = () => {
    if (!isActive || !stream || sendReaction.isPending) return;
    addHeart();
    sendReaction.mutate({ id: stream.id, type: "LIKE" });
  };

  const handleFollow = () => {
    if (!stream?.host || followHost.isPending) return;
    followHost.mutate({
      username: stream.host.username,
      isFollowing: stream.host.isFollowing,
    });
  };

  const handleShare = async () => {
    if (!stream) return;
    const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
    const localePrefix = firstSegment && firstSegment !== "lives" ? `/${firstSegment}` : "";
    const shareUrl = `${window.location.origin}${localePrefix}/lives/${stream.id}`;
    if (navigator.share) {
      await navigator.share({ title: stream.title, url: shareUrl });
      return;
    }
    await navigator.clipboard?.writeText(shareUrl);
    setCopyToast(true);
    window.setTimeout(() => setCopyToast(false), 2500);
  };

  if (isInfoLoading && !initialStream) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isError || !stream) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
        <WifiOff className="h-10 w-10 text-white/50" />
        <p className="text-lg font-bold">Stream unavailable</p>
        <p className="max-w-sm text-sm text-white/60">This live stream could not be loaded.</p>
      </div>
    );
  }

  const isLive = stream.status === "LIVE" && !streamEndedBySocket;
  const isOwnStream = currentUser?.id === stream.host?.id;
  const liveError = connectionError || joinError;
  const shouldConnect = isActive && isLive && Boolean(token && url) && !liveError;
  // Show the "Click to join" overlay in preview mode before the user opts in
  const showJoinOverlay = previewMode && isLive && !userWantsToJoin && !token;
  const showGuestPanel = isActive && !showJoinOverlay;
  const titleStyle: React.CSSProperties | undefined = showGuestPanel
    ? { bottom: "min(calc(42% + 1rem), 376px)" }
    : undefined;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        {!isLive ? (
          <StreamPoster stream={stream} title={hostName} />
        ) : shouldConnect ? (
          <LiveKitRoom
            video={false}
            audio={false}
            token={token}
            serverUrl={url}
            connect={isActive}
            className="h-full w-full"
            onConnected={() => setConnectionError("")}
            onError={(error) => setConnectionError(error.message || "Could not connect to LiveKit.")}
            onDisconnected={(reason) => {
              if (isActive && reason) {
                setConnectionError(`LiveKit disconnected: ${reason}`);
              }
            }}
          >
            <HostVideo />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : showJoinOverlay ? (
          <StreamPreviewOverlay
            stream={stream}
            title={hostName}
            onJoin={() => setUserWantsToJoin(true)}
          />
        ) : (
          <StreamLoadingPoster stream={stream} joinError={liveError} isJoining={joinMutation.isPending} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-72 bg-gradient-to-t from-black/85 to-transparent" />

      <div className="absolute left-4 right-20 top-5 z-30 flex items-center justify-between gap-3 md:left-6 md:right-24">
        <div className="flex min-w-0 items-center gap-3 rounded-full bg-black/35 p-1 pr-4 text-white backdrop-blur-md">
          <Avatar src={stream.host?.avatarUrl || ""} alt={stream.host?.username || "Host"} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{hostName}</p>
            <p className="text-xs text-white/70">{stream.viewerCount} viewers</p>
          </div>
          {!isOwnStream && (
            <Button
              size="sm"
              className="h-8 px-4"
              variant={stream.host?.isFollowing ? "secondary" : "primary"}
              onClick={handleFollow}
              disabled={!currentUser || followHost.isPending}
            >
              {stream.host?.isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
        {isLive && (
          <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
            <Radio className="h-4 w-4 text-brand" />
            LIVE
          </div>
        )}
      </div>

      <div
        className={`absolute left-4 right-24 z-30 text-white md:left-6 md:max-w-xl ${
          showGuestPanel ? "" : "bottom-24 md:bottom-8"
        }`}
        style={titleStyle}
      >
        <h2 className="line-clamp-2 text-lg font-bold drop-shadow-md md:text-2xl">{stream.title}</h2>
        {stream.description && (
          <p className="mt-2 line-clamp-2 text-sm text-white/80 drop-shadow-md">{stream.description}</p>
        )}
        {stream.categoryName && (
          <p className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {stream.categoryName}
          </p>
        )}
      </div>

      {/* Interactive controls — only shown once connected (not in preview overlay mode) */}
      {isActive && isLive && !showJoinOverlay && (
        <>
          <LiveActionRail
            likeCount={visibleLikeCount}
            giftCount={stream.giftCount}
            allowGifts={stream.allowGifts}
            onLike={handleLike}
            onGift={() => setIsGiftPanelOpen(true)}
            onComment={() => setChatFocusSignal((value) => value + 1)}
            onShare={handleShare}
          />
          <FloatingHeartLayer hearts={hearts} />
          <GiftPanel
            livestreamId={stream.id}
            isOpen={isActive && isGiftPanelOpen}
            onClose={() => setIsGiftPanelOpen(false)}
          />
        </>
      )}

      {showGuestPanel && (
        <div className="absolute bottom-0 left-0 right-16 z-30 h-[42%] max-h-[360px] md:right-auto md:w-[420px]">
          {isLive ? (
            <LiveChat
              livestreamId={streamId}
              isHost={false}
              focusSignal={chatFocusSignal}
              enableSocket
            />
          ) : (
            <div className="flex h-full items-end p-4 text-sm text-white/70">
              Chat will be available when the host goes live.
            </div>
          )}
        </div>
      )}

      {copyToast && (
        <div className="absolute left-1/2 top-20 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#222] px-4 py-2.5 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="size-4 text-green-400" />
          {t("copyLinkSuccess")}
        </div>
      )}
    </div>
  );
}

function StreamPoster({ stream, title }: { stream: LivestreamResponse; title: string }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stream.thumbnailUrl || stream.host?.avatarUrl || "/placeholder.jpg"}
        className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xl"
        alt=""
      />
      <div className="relative z-10">
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white/15">
          <Avatar src={stream.host?.avatarUrl || ""} alt={stream.host?.username || "Host"} size="lg" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-white/70">
          {stream.status === "ENDED" ? "Livestream has ended" : "Waiting for host to go live."}
        </p>
      </div>
    </div>
  );
}

/** Feed-only: blurred thumbnail preview with a "Click to join" / "Nhấp vào để xem" CTA. */
function StreamPreviewOverlay({
  stream,
  title,
  onJoin,
}: {
  stream: LivestreamResponse;
  title: string;
  onJoin: () => void;
}) {
  const isVi =
    typeof window !== "undefined" && window.location.pathname.startsWith("/vi");
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stream.thumbnailUrl || stream.host?.avatarUrl || "/placeholder.jpg"}
        className="absolute inset-0 h-full w-full object-cover opacity-30 blur-md"
        alt=""
      />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/20 shadow-xl">
          <Avatar src={stream.host?.avatarUrl || ""} alt={stream.host?.username || "Host"} size="lg" />
        </div>
        <div>
          <p className="text-xl font-bold drop-shadow">{title}</p>
          <p className="mt-1 text-sm text-white/70">
            {stream.viewerCount} {isVi ? "người xem" : "viewers"}
          </p>
        </div>
        <button
          type="button"
          id="join-live-btn"
          onClick={onJoin}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-7 py-3 text-sm font-bold text-black shadow-2xl transition hover:bg-white active:scale-95"
        >
          <Radio className="h-4 w-4 text-brand" />
          {isVi ? "Nhấp vào để xem" : "Click to join"}
        </button>
      </div>
    </div>
  );
}

function StreamLoadingPoster({
  stream,
  joinError,
  isJoining,
}: {
  stream: LivestreamResponse;
  joinError: string;
  isJoining: boolean;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stream.thumbnailUrl || stream.host?.avatarUrl || "/placeholder.jpg"}
        className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl"
        alt=""
      />
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
        {joinError ? (
          <>
            <WifiOff className="h-10 w-10 text-white/50" />
            <p className="text-sm text-white/70">{joinError}</p>
          </>
        ) : (
          <>
            <Loader2 className="h-9 w-9 animate-spin text-white/70" />
            <p className="text-sm text-white/70">
              {isJoining ? "Joining live stream..." : "Preparing live stream..."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
