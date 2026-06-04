"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useLivestream, useEndLivestream, useStreamReadiness, useLiveSocket } from "@/hooks/live-hooks";
import { Button } from "@repo/ui";
import {
  Camera,
  CameraOff,
  CheckCircle,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  Radio,
  ScreenShareOff,
  WifiOff,
} from "lucide-react";
import LiveChat from "@/components/lives/LiveChat";
import type { LivestreamStartupPhase } from "@/types/live";
import { useTranslations } from "next-intl";

type LivestreamSourceMode = "face" | "screen";

// ── Phase indicator icon ──────────────────────────────────────────────────────

function PhaseIcon({ phase }: { phase: LivestreamStartupPhase }) {
  switch (phase) {
    case "CONNECTED":
    case "LIVE":
      return <CheckCircle className="h-10 w-10 text-green-400" />;
    case "FAILED":
    case "TIMEOUT":
      return <WifiOff className="h-12 w-12 text-brand" />;
    default:
      return <Loader2 className="h-12 w-12 animate-spin text-brand" />;
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HostStudioActivePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("LiveStudio");
  const streamId = Number(params.id);
  const [requestedSource] = useState<LivestreamSourceMode>(() => {
    if (typeof window === "undefined") return "face";
    return new URLSearchParams(window.location.search).get("source") === "screen"
      ? "screen"
      : "face";
  });

  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [isEndingStream, setIsEndingStream] = useState(false);
  /** true once LiveKit `onConnected` has fired at least once */
  const hasConnectedRef = useRef(false);

  const { data: streamInfo } = useLivestream(Number.isFinite(streamId) ? streamId : null);
  const endStream = useEndLivestream();

  const { phase, errorMessage, pollAttempts, startStream, reset } =
    useStreamReadiness({ maxWaitMs: 60_000 });

  // Subscribe to WebSocket for real-time viewer count / reactions while live
  useLiveSocket(
    !isEndingStream && (phase === "CONNECTED" || phase === "LIVE") ? streamId : null,
    undefined,
    // If room_finished event received from LiveKit, end the stream and redirect
    () => {
      setIsEndingStream(true);
      setToken("");
      setUrl("");
      router.replace("/lives/studio");
    }
  );

  // Auto-start exactly once on mount.
  // `startStream` has an in-flight guard so double-invocation (React strict mode) is safe.
  useEffect(() => {
    if (!Number.isFinite(streamId) || streamId <= 0) return;

    void (async () => {
      try {
        const { token: t, url: u } = await startStream(streamId);
        setToken(t);
        setUrl(u);
      } catch {
        // phase / errorMessage already updated by the hook
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const handleRetry = () => {
    reset();
    setIsEndingStream(false);
    setToken("");
    setUrl("");
    setConnectionError("");
    hasConnectedRef.current = false;
    void (async () => {
      try {
        const { token: t, url: u } = await startStream(streamId);
        setToken(t);
        setUrl(u);
      } catch {
        // handled by hook state
      }
    })();
  };

  const handleEndStream = async () => {
    if (isEndingStream || endStream.isPending) {
      return;
    }

    setIsEndingStream(true);
    setConnectionError("");
    setToken("");
    setUrl("");
    hasConnectedRef.current = false;

    try {
      await endStream.mutateAsync(streamId);
      router.replace("/lives/studio");
    } catch {
      setIsEndingStream(false);
      alert(t("endFailed"));
    }
  };

  // ── Error / timeout screens ───────────────────────────────────────────────

  if (phase === "FAILED" || phase === "TIMEOUT") {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <PhaseIcon phase={phase} />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {phase === "TIMEOUT"
              ? t("timeoutTitle")
              : t("startFailedTitle")}
          </h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">{errorMessage}</p>
          {pollAttempts > 0 && (
            <p className="mt-1 text-xs text-text-muted opacity-60">
              {t("pollAttempts", { count: pollAttempts })}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="secondary">
            {t("tryAgain")}
          </Button>
          <Button onClick={() => router.push("/lives/studio")} variant="secondary">
            {t("backToStudio")}
          </Button>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="h-12 w-12 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("connectionFailedTitle")}</h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">{connectionError}</p>
        </div>
        <Button onClick={handleRetry} variant="secondary">
          {t("reconnect")}
        </Button>
      </div>
    );
  }

  if (isEndingStream) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("endingTitle")}</h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">{t("endingDescription")}</p>
        </div>
      </div>
    );
  }

  // ── Loading screen (any pre-connected phase) ──────────────────────────────

  if (!token || !url || (phase !== "CONNECTED" && phase !== "LIVE")) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <PhaseIcon phase={phase} />
        <div className="text-center">
          <p className="text-text-primary text-lg font-semibold">{t(`phase.${phase}`)}</p>

          {/* Mini lifecycle pill row */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {(["STARTING", "READY", "CONNECTED"] as LivestreamStartupPhase[]).map((p) => (
              <span
                key={p}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  phase === p
                    ? "bg-brand text-white"
                    : "bg-surface-secondary text-text-muted"
                }`}
              >
                {p}
              </span>
            ))}
          </div>

          {pollAttempts > 0 && (
            <p className="mt-2 text-xs text-text-muted opacity-60">
              {t("verifyingReady", { count: pollAttempts })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Fully started: mount LiveKit room ────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-64px)] overflow-hidden bg-background">
      <div className="lg:col-span-2 xl:col-span-3 h-full flex flex-col border-r bg-black relative">
        <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={url}
          connect={!isEndingStream}
          data-lk-theme="default"
          className="w-full h-full"
          onConnected={() => {
            hasConnectedRef.current = true;
            setConnectionError("");
          }}
          onError={(error) =>
            setConnectionError(error.message || "Could not connect to LiveKit.")
          }
          onDisconnected={(reason) => {
            // Only treat as an error when we have previously connected successfully
            if (reason && hasConnectedRef.current && !isEndingStream) {
              setConnectionError(`LiveKit disconnected: ${reason}`);
            }
          }}
        >
          <HostStudioStage
            title={streamInfo?.data?.title || t("untitledLive")}
            viewerCount={streamInfo?.data?.viewerCount || 0}
            likeCount={streamInfo?.data?.likeCount || 0}
            initialSourceMode={requestedSource}
            onEndStream={handleEndStream}
            isEnding={isEndingStream || endStream.isPending}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>

      {/* Side Chat & Moderation Panel */}
      <div className="lg:col-span-1 h-full flex flex-col bg-card">
        <div className="p-4 border-b border-elevated shrink-0 flex items-center justify-between bg-elevated/30">
          <h3 className="font-semibold text-lg">{t("studioChat")}</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <LiveChat livestreamId={streamId} isHost={true} />
        </div>
      </div>
    </div>
  );
}

// ── HostStudioStage ───────────────────────────────────────────────────────────

interface HostStudioStageProps {
  title: string;
  viewerCount: number;
  likeCount: number;
  initialSourceMode: LivestreamSourceMode;
  onEndStream: () => void;
  isEnding: boolean;
}

function HostStudioStage({
  title,
  viewerCount,
  likeCount,
  initialSourceMode,
  onEndStream,
  isEnding,
}: HostStudioStageProps) {
  const t = useTranslations("LiveStudio");
  const {
    localParticipant,
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenShareEnabled,
    lastCameraError,
    lastMicrophoneError,
  } = useLocalParticipant();
  const [mediaError, setMediaError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const initializedRef = useRef(false);

  const localVideoTracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]).filter((trackRef) => isTrackReference(trackRef) && trackRef.participant.isLocal);

  const screenTrack = localVideoTracks.find(
    (trackRef) =>
      isTrackReference(trackRef) && trackRef.source === Track.Source.ScreenShare,
  );
  const cameraTrack = localVideoTracks.find(
    (trackRef) =>
      isTrackReference(trackRef) && trackRef.source === Track.Source.Camera,
  );
  const activeTrack = isScreenShareEnabled ? screenTrack : cameraTrack;
  const visibleMediaError =
    mediaError || lastCameraError?.message || lastMicrophoneError?.message || "";

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const enableInitialMedia = async () => {
      try {
        await localParticipant.setMicrophoneEnabled(true);
        if (initialSourceMode === "screen") {
          await localParticipant.setCameraEnabled(false);
          await localParticipant.setScreenShareEnabled(true);
          return;
        }
        await localParticipant.setScreenShareEnabled(false);
        await localParticipant.setCameraEnabled(true);
      } catch (error) {
        setMediaError(getMediaErrorMessage(error, t("mediaAccessError")));
      }
    };

    void enableInitialMedia();
  }, [initialSourceMode, localParticipant, t]);

  const runMediaAction = async (action: () => Promise<unknown>) => {
    setIsSwitching(true);
    setMediaError("");
    try {
      await action();
    } catch (error) {
      setMediaError(getMediaErrorMessage(error, t("mediaAccessError")));
    } finally {
      setIsSwitching(false);
    }
  };

  const showCamera = () =>
    void runMediaAction(async () => {
      await localParticipant.setScreenShareEnabled(false);
      await localParticipant.setCameraEnabled(true);
    });

  const showScreen = () =>
    void runMediaAction(async () => {
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setScreenShareEnabled(true);
    });

  const toggleMic = () =>
    void runMediaAction(() =>
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
    );

  const toggleCamera = () =>
    void runMediaAction(() =>
      localParticipant.setCameraEnabled(!isCameraEnabled),
    );

  const stopScreenShare = () =>
    void runMediaAction(async () => {
      await localParticipant.setScreenShareEnabled(false);
      await localParticipant.setCameraEnabled(true);
    });

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {activeTrack && isTrackReference(activeTrack) ? (
          <VideoTrack
            trackRef={activeTrack}
            className={`h-full w-full ${
              isScreenShareEnabled ? "object-contain" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-950">
            {isScreenShareEnabled ? (
              <MonitorUp className="h-14 w-14 text-white/35" />
            ) : (
              <CameraOff className="h-14 w-14 text-white/35" />
            )}
            <p className="text-sm text-white/60">
              {isScreenShareEnabled
                ? t("chooseScreen")
                : t("cameraPreviewOff")}
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="absolute left-5 right-5 top-5 z-20 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold drop-shadow-md">{title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-xs font-bold text-white">
              <Radio className="h-3.5 w-3.5" />
              LIVE
            </span>
            <span className="text-white">{t("viewerCount", { count: viewerCount })}</span>
            <span className="text-white">{t("likeCount", { count: likeCount })}</span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              {isScreenShareEnabled ? t("screenTitle") : t("faceTitle")}
            </span>
          </div>
        </div>
        <Button
          variant="danger"
          onClick={onEndStream}
          isLoading={isEnding}
          className="shrink-0 shadow-lg"
        >
          {t("endStream")}
        </Button>
      </div>

      {visibleMediaError && (
        <div className="absolute left-5 right-5 top-28 z-20 rounded-md border border-brand/40 bg-black/70 px-4 py-3 text-sm text-white backdrop-blur">
          {visibleMediaError}
        </div>
      )}

      <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-wrap items-center justify-center gap-3">
        <StudioControlButton
          active={!isScreenShareEnabled && isCameraEnabled}
          disabled={isSwitching}
          icon={<Camera className="h-5 w-5" />}
          label={t("faceTitle")}
          onClick={showCamera}
        />
        <StudioControlButton
          active={isScreenShareEnabled}
          disabled={isSwitching}
          icon={<MonitorUp className="h-5 w-5" />}
          label={t("screenTitle")}
          onClick={showScreen}
        />
        {isScreenShareEnabled ? (
          <StudioControlButton
            disabled={isSwitching}
            icon={<ScreenShareOff className="h-5 w-5" />}
            label={t("stopScreen")}
            onClick={stopScreenShare}
          />
        ) : (
          <StudioControlButton
            active={isCameraEnabled}
            disabled={isSwitching}
            icon={
              isCameraEnabled ? (
                <Camera className="h-5 w-5" />
              ) : (
                <CameraOff className="h-5 w-5" />
              )
            }
            label={isCameraEnabled ? t("cameraOn") : t("cameraOff")}
            onClick={toggleCamera}
          />
        )}
        <StudioControlButton
          active={isMicrophoneEnabled}
          disabled={isSwitching}
          icon={
            isMicrophoneEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )
          }
          label={isMicrophoneEnabled ? t("micOn") : t("micOff")}
          onClick={toggleMic}
        />
      </div>
    </div>
  );
}

// ── StudioControlButton ───────────────────────────────────────────────────────

interface StudioControlButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function StudioControlButton({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: StudioControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold transition active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? "bg-white text-black hover:bg-white/90"
          : "bg-white/12 text-white backdrop-blur hover:bg-white/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function getMediaErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
