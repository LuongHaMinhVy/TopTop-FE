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
import { useLivestream, useStartLivestream, useEndLivestream } from "@/hooks/live-hooks";
import { Button } from "@repo/ui";
import {
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  Radio,
  ScreenShareOff,
  WifiOff,
} from "lucide-react";
import LiveChat from "@/components/lives/LiveChat";

export default function HostStudioActivePage() {
  const params = useParams();
  const router = useRouter();
  const streamId = Number(params.id);
  
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [startError, setStartError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [startTimedOut, setStartTimedOut] = useState(false);
  const [startAttempt, setStartAttempt] = useState(0);
  const startRequestedRef = useRef(false);
  
  const { data: streamInfo } = useLivestream(Number.isFinite(streamId) ? streamId : null);
  const startStream = useStartLivestream();
  const endStream = useEndLivestream();

  useEffect(() => {
    if (!Number.isFinite(streamId) || streamId <= 0 || startRequestedRef.current) return;
    
    // Auto start the stream when entering the studio room
    startRequestedRef.current = true;
    setStartTimedOut(false);
    startStream.mutate(streamId, {
      onSuccess: (res) => {
        if (res.data?.token && res.data?.livekitUrl) {
          setStartTimedOut(false);
          setToken(res.data.token);
          setUrl(res.data.livekitUrl);
        } else {
          setStartError("Backend started the livestream but did not return a LiveKit token.");
          startRequestedRef.current = false;
        }
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { message?: string } } };
        setStartError(error.response?.data?.message || "Failed to start stream");
        startRequestedRef.current = false;
      }
    });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, startAttempt]);

  useEffect(() => {
    if (token && url) {
      return;
    }
    if (!startRequestedRef.current || startError) return;

    const timeoutId = window.setTimeout(() => {
      if (!token || !url) {
        setStartTimedOut(true);
      }
    }, 15000);

    return () => window.clearTimeout(timeoutId);
  }, [startError, token, url]);

  const retryStart = () => {
    startRequestedRef.current = false;
    setToken("");
    setUrl("");
    setStartError("");
    setConnectionError("");
    setStartTimedOut(false);
    startStream.reset();
    setStartAttempt((attempt) => attempt + 1);
  };

  const handleEndStream = async () => {
    try {
      await endStream.mutateAsync(streamId);
      router.push("/lives/studio");
    } catch {
      alert("Failed to end stream");
    }
  };

  if (startError) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="h-12 w-12 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Could not start livestream</h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">{startError}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={retryStart} variant="secondary">
            Try Again
          </Button>
          <Button onClick={() => router.push("/lives/studio")} variant="secondary">
            Back to Studio
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
          <h1 className="text-2xl font-bold text-text-primary">LiveKit connection failed</h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">{connectionError}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="secondary">
          Reconnect
        </Button>
      </div>
    );
  }

  if (startTimedOut) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="h-12 w-12 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Studio start is taking too long</h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            The app is still waiting for a LiveKit token from the backend. Check the Network tab for
            <span className="font-mono"> /lives/{streamId}/start </span>
            or restart the backend, then try again.
          </p>
        </div>
        <Button onClick={retryStart} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand" />
        <p className="text-text-muted text-lg">
          {startStream.isPending ? "Starting livestream..." : "Initializing studio..."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-64px)] overflow-hidden bg-background">
      <div className="lg:col-span-2 xl:col-span-3 h-full flex flex-col border-r bg-black relative">
        <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={url}
          connect={true}
          data-lk-theme="default"
          className="w-full h-full"
          onConnected={() => setConnectionError("")}
          onError={(error) => setConnectionError(error.message || "Could not connect to LiveKit.")}
          onDisconnected={(reason) => {
            if (reason) {
              setConnectionError(`LiveKit disconnected: ${reason}`);
            }
          }}
        >
          <HostStudioStage
            title={streamInfo?.data?.title || "Untitled live"}
            viewerCount={streamInfo?.data?.viewerCount || 0}
            likeCount={streamInfo?.data?.likeCount || 0}
            onEndStream={handleEndStream}
            isEnding={endStream.isPending}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>

      {/* Side Chat & Moderation Panel */}
      <div className="lg:col-span-1 h-full flex flex-col bg-card">
        <div className="p-4 border-b border-elevated shrink-0 flex items-center justify-between bg-elevated/30">
          <h3 className="font-semibold text-lg">Studio Chat</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <LiveChat livestreamId={streamId} isHost={true} />
        </div>
      </div>
    </div>
  );
}

interface HostStudioStageProps {
  title: string;
  viewerCount: number;
  likeCount: number;
  onEndStream: () => void;
  isEnding: boolean;
}

function HostStudioStage({
  title,
  viewerCount,
  likeCount,
  onEndStream,
  isEnding,
}: HostStudioStageProps) {
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
    (trackRef) => isTrackReference(trackRef) && trackRef.source === Track.Source.ScreenShare,
  );
  const cameraTrack = localVideoTracks.find(
    (trackRef) => isTrackReference(trackRef) && trackRef.source === Track.Source.Camera,
  );
  const activeTrack = isScreenShareEnabled ? screenTrack : cameraTrack;
  const visibleMediaError = mediaError || lastCameraError?.message || lastMicrophoneError?.message || "";

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const enableInitialMedia = async () => {
      try {
        await localParticipant.setCameraEnabled(true);
        await localParticipant.setMicrophoneEnabled(true);
      } catch (error) {
        setMediaError(getMediaErrorMessage(error));
      }
    };

    void enableInitialMedia();
  }, [localParticipant]);

  const runMediaAction = async (action: () => Promise<unknown>) => {
    setIsSwitching(true);
    setMediaError("");
    try {
      await action();
    } catch (error) {
      setMediaError(getMediaErrorMessage(error));
    } finally {
      setIsSwitching(false);
    }
  };

  const showCamera = () => {
    void runMediaAction(async () => {
      await localParticipant.setScreenShareEnabled(false);
      await localParticipant.setCameraEnabled(true);
    });
  };

  const showScreen = () => {
    void runMediaAction(async () => {
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setScreenShareEnabled(true);
    });
  };

  const toggleMic = () => {
    void runMediaAction(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled));
  };

  const toggleCamera = () => {
    void runMediaAction(() => localParticipant.setCameraEnabled(!isCameraEnabled));
  };

  const stopScreenShare = () => {
    void runMediaAction(async () => {
      await localParticipant.setScreenShareEnabled(false);
      await localParticipant.setCameraEnabled(true);
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {activeTrack && isTrackReference(activeTrack) ? (
          <VideoTrack
            trackRef={activeTrack}
            className={`h-full w-full ${isScreenShareEnabled ? "object-contain" : "object-cover"}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-950">
            {isScreenShareEnabled ? (
              <MonitorUp className="h-14 w-14 text-white/35" />
            ) : (
              <CameraOff className="h-14 w-14 text-white/35" />
            )}
            <p className="text-sm text-white/60">
              {isScreenShareEnabled ? "Choose a screen to share" : "Camera preview is off"}
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
            <span className="text-white">{viewerCount} viewers</span>
            <span className="text-white">{likeCount} likes</span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              {isScreenShareEnabled ? "Screen" : "Face"}
            </span>
          </div>
        </div>
        <Button
          variant="danger"
          onClick={onEndStream}
          isLoading={isEnding}
          className="shrink-0 shadow-lg"
        >
          End Stream
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
          label="Face"
          onClick={showCamera}
        />
        <StudioControlButton
          active={isScreenShareEnabled}
          disabled={isSwitching}
          icon={<MonitorUp className="h-5 w-5" />}
          label="Screen"
          onClick={showScreen}
        />
        {isScreenShareEnabled ? (
          <StudioControlButton
            disabled={isSwitching}
            icon={<ScreenShareOff className="h-5 w-5" />}
            label="Stop screen"
            onClick={stopScreenShare}
          />
        ) : (
          <StudioControlButton
            active={isCameraEnabled}
            disabled={isSwitching}
            icon={isCameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            label={isCameraEnabled ? "Camera on" : "Camera off"}
            onClick={toggleCamera}
          />
        )}
        <StudioControlButton
          active={isMicrophoneEnabled}
          disabled={isSwitching}
          icon={isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          label={isMicrophoneEnabled ? "Mic on" : "Mic off"}
          onClick={toggleMic}
        />
      </div>
    </div>
  );
}

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

function getMediaErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not access the selected camera, microphone, or screen.";
}
