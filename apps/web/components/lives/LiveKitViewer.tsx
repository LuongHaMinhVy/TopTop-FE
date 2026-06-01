"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Avatar, Button } from "@repo/ui";
import { Loader2, Radio, WifiOff } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  useFollowLiveHost,
  useJoinLivestream,
  useLivestream,
  useSendReaction,
} from "@/hooks/live-hooks";
import type { LivestreamResponse } from "@/types/live";
import FloatingHeartLayer, { type FloatingHeart } from "./FloatingHeartLayer";
import GiftPanel from "./GiftPanel";
import LiveActionRail from "./LiveActionRail";
import LiveChat from "./LiveChat";

const HostVideo = () => {
  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);
  const cameraTrack = cameraTracks[0];

  if (!cameraTrack || !isTrackReference(cameraTrack)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-sm text-white/60">Host paused video</p>
      </div>
    );
  }

  return <VideoTrack trackRef={cameraTrack} className="h-full w-full object-cover" />;
};

interface LiveKitViewerProps {
  streamId: number;
  isActive: boolean;
  initialStream?: LivestreamResponse;
}

export default function LiveKitViewer({ streamId, isActive, initialStream }: LiveKitViewerProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { data: streamInfo, isLoading: isInfoLoading, isError } = useLivestream(streamId);
  const joinMutation = useJoinLivestream();
  const sendReaction = useSendReaction();
  const followHost = useFollowLiveHost();

  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [joinError, setJoinError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
  const [chatFocusSignal, setChatFocusSignal] = useState(0);
  const hasAttemptedJoin = useRef(false);

  const stream = streamInfo?.data || initialStream;
  const visibleLikeCount = stream?.likeCount || 0;

  useEffect(() => {
    if (!isActive || token || hasAttemptedJoin.current || stream?.status !== "LIVE") return;

    hasAttemptedJoin.current = true;
    setJoinError("");
    setConnectionError("");
    joinMutation.mutate(streamId, {
      onSuccess: (res) => {
        if (res.data) {
          setToken(res.data.token);
          setUrl(res.data.livekitUrl);
        }
      },
      onError: (error: unknown) => {
        const maybeError = error as { response?: { data?: { message?: string } } };
        setJoinError(maybeError.response?.data?.message || "Could not join this live stream.");
        hasAttemptedJoin.current = false;
      },
    });
  }, [isActive, joinMutation, stream?.status, streamId, token]);

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

  const isLive = stream.status === "LIVE";
  const isOwnStream = currentUser?.id === stream.host?.id;
  const liveError = connectionError || joinError;
  const shouldConnect = isActive && isLive && Boolean(token && url) && !liveError;

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

      <div className="absolute bottom-24 left-4 right-24 z-30 text-white md:bottom-8 md:left-6 md:max-w-xl">
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

      {isActive && isLive && (
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

      {isActive && (
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
