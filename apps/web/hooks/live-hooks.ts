/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as liveService from "@/services/live-api-service";
import type { ApiResponse } from "@/types/api";
import type { CreateLivestreamRequest, SendChatMessageRequest, SendGiftRequest, LiveChatMessageResponse, LivestreamResponse, LivestreamStartupPhase } from "@/types/live";
import { useEffect, useCallback, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getBackendBaseUrl } from "@/utils/axios-instance";


// ── Queries ──────────────────────────────────────────────────────────────────

export const useLiveFeed = (size = 20) => {
  return useInfiniteQuery({
    queryKey: ["live", "feed"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => liveService.getFeed(pageParam, size),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.meta && lastPage.meta.page < lastPage.meta.totalPages - 1) {
        return lastPage.meta.page + 1;
      }
      if (!lastPage.meta && (lastPage.data?.length || 0) === size) {
        return allPages.length;
      }
      return undefined;
    },
  });
};

export const useLivestream = (id: number | null) => {
  return useQuery({
    queryKey: ["live", id],
    queryFn: () => id ? liveService.getLivestream(id) : Promise.reject("No ID"),
    enabled: !!id,
    // Reduced to 3 s so viewer and host pages detect status changes quickly
    refetchInterval: 3000,
  });
};

export const useMyLivestreams = (enabled = true) => {
  return useQuery({
    queryKey: ["live", "me"],
    queryFn: liveService.getMyLivestreams,
    enabled,
  });
};

export const useChatHistory = (id: number | null) => {
  return useInfiniteQuery({
    queryKey: ["live", "chat", id],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => id ? liveService.getChatHistory(id, pageParam as number) : Promise.reject("No ID"),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.page < lastPage.meta.totalPages - 1) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    enabled: !!id,
  });
};

export const useGiftCatalog = () => {
  return useQuery({
    queryKey: ["live", "gifts", "catalog"],
    queryFn: liveService.getGiftCatalog,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// ── Mutations ────────────────────────────────────────────────────────────────

export const useCreateLivestream = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLivestreamRequest) => liveService.createLivestream(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live", "me"] });
    },
  });
};

export const useStartLivestream = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => liveService.startLivestream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["live", id] });
      queryClient.invalidateQueries({ queryKey: ["live", "me"] });
    },
  });
};

export const useJoinLivestream = () => {
  return useMutation({
    mutationFn: (id: number) => liveService.joinLivestream(id),
  });
};

export const useEndLivestream = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => liveService.endLivestream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["live", id] });
      queryClient.invalidateQueries({ queryKey: ["live", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["live", "me"] });
    },
  });
};

export const useLeaveStream = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => liveService.leaveStream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["live", id] });
    },
  });
};

export const useSendLiveMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SendChatMessageRequest }) => liveService.sendChatMessage(id, data),
    onSuccess: (_, {id}) => {
      queryClient.invalidateQueries({ queryKey: ["live", id] });
    },
  });
};

export const useSendReaction = () => {
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type?: string }) => liveService.sendReaction(id, type),
  });
};

export const useSendGift = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SendGiftRequest }) => liveService.sendGift(id, data),
  });
};

export const useFollowLiveHost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, isFollowing }: { username: string; isFollowing: boolean }) =>
      isFollowing ? liveService.unfollowHost(username) : liveService.followHost(username),
    onMutate: async ({ username, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ["live"] });

      const previousQueries = queryClient.getQueriesData<ApiResponse<LivestreamResponse>>({
        queryKey: ["live"],
      });

      previousQueries.forEach(([queryKey, value]) => {
        if (!value?.data || value.data.host?.username !== username) return;
        queryClient.setQueryData(queryKey, {
          ...value,
          data: {
            ...value.data,
            host: {
              ...value.data.host,
              isFollowing: !isFollowing,
            },
          },
        });
      });

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["live"] });
      queryClient.invalidateQueries({ queryKey: ["following-tray"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
    },
  });
};

export const useLiveModeration = () => {
  return {
    hideMessage: useMutation({
      mutationFn: ({ id, messageId }: { id: number; messageId: number }) => liveService.hideMessage(id, messageId),
    }),
    pinMessage: useMutation({
      mutationFn: ({ id, messageId }: { id: number; messageId: number }) => liveService.pinMessage(id, messageId),
    }),
    banUser: useMutation({
      mutationFn: ({ id, userId, reason }: { id: number; userId: number; reason?: string }) => liveService.banUser(id, userId, reason),
    }),
  };
};

// ── Stream startup readiness ────────────────────────────────────────────────

export interface UseStreamReadinessOptions {
  /** Max time in ms to wait for the stream to go LIVE after calling start(). Default 60 000. */
  maxWaitMs?: number;
}

export interface UseStreamReadinessResult {
  phase: LivestreamStartupPhase;
  /** Human-readable label for current phase, suitable for UI display. */
  phaseLabel: string;
  /** Set when phase is FAILED or TIMEOUT. */
  errorMessage: string;
  /** Number of poll retries while waiting for LIVE status. */
  pollAttempts: number;
  /**
   * Starts the stream: calls POST /start then polls until LIVE.
   * Returns the join response (token + url) when ready.
   * Throws if the stream fails or times out.
   */
  startStream: (streamId: number) => Promise<{ token: string; url: string }>;
  /** Resets state to CREATING so the user can try again. */
  reset: () => void;
}

const PHASE_LABELS: Record<LivestreamStartupPhase, string> = {
  CREATING:  "Setting up livestream...",
  STARTING:  "Starting livestream...",
  READY:     "Connecting to stream server...",
  CONNECTED: "Joining room...",
  LIVE:      "You are live!",
  FAILED:    "Failed to start stream",
  TIMEOUT:   "Stream is taking too long to start",
};

/**
 * Manages the full host startup lifecycle:
 *   CREATING → STARTING → (poll) → READY → CONNECTED → LIVE
 *
 * Prevents duplicate start calls (idempotent) and cleans up the polling
 * AbortController on unmount or explicit reset.
 */
export const useStreamReadiness = (
  options: UseStreamReadinessOptions = {}
): UseStreamReadinessResult => {
  const { maxWaitMs = 60_000 } = options;
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<LivestreamStartupPhase>("CREATING");
  const [errorMessage, setErrorMessage] = useState("");
  const [pollAttempts, setPollAttempts] = useState(0);

  // AbortController for the polling loop so cleanup is possible on unmount/reset
  const abortRef = useRef<AbortController | null>(null);
  // Guard: prevent duplicate concurrent startStream calls
  const inFlightRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;
    setPhase("CREATING");
    setErrorMessage("");
    setPollAttempts(0);
  }, []);

  const startStream = useCallback(
    async (streamId: number): Promise<{ token: string; url: string }> => {
      // Idempotency guard: refuse a second concurrent call
      if (inFlightRef.current) {
        throw new Error("A start attempt is already in progress.");
      }
      inFlightRef.current = true;

      // Clean up any leftover abort controller from a previous attempt
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase("STARTING");
      setErrorMessage("");
      setPollAttempts(0);

      try {
        // 1. Call POST /lives/{id}/start — backend marks status LIVE and returns token
        const startRes = await liveService.startLivestream(streamId);

        if (!startRes.data?.token || !startRes.data?.livekitUrl) {
          throw new Error("Backend did not return a LiveKit token.");
        }

        // Invalidate queries so the rest of the UI sees the LIVE status immediately
        await queryClient.invalidateQueries({ queryKey: ["live", streamId] });
        await queryClient.invalidateQueries({ queryKey: ["live", "me"] });

        // 2. Backend returned token: status is already LIVE in DB (our backend sets it synchronously).
        //    Proceed directly to CONNECTED state.
        setPhase("CONNECTED");
        inFlightRef.current = false;
        return {
          token: startRes.data.token,
          url: startRes.data.livekitUrl,
        };
      } catch (err) {
        inFlightRef.current = false;
        if (phase !== "TIMEOUT" && phase !== "FAILED" && phase !== "CONNECTED") {
          const msg =
            err instanceof Error
              ? err.message
              : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Could not start the livestream.";
          if (msg !== "ABORTED") {
            setPhase("FAILED");
            setErrorMessage(msg);
          }
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxWaitMs, queryClient]
  );

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    errorMessage,
    pollAttempts,
    startStream,
    reset,
  };
};

// ── WebSockets ───────────────────────────────────────────────────────────────

export const useLiveSocket = (
  livestreamId: number | null,
  onEvent?: (event: any) => void,
  onStreamEnded?: () => void
) => {
  const queryClient = useQueryClient();

  const upsertChatMessage = useCallback(
    (convId: number, incoming: LiveChatMessageResponse) => {
      const queryKey = ["live", "chat", convId];
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        let found = false;
        const updated = {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: LiveChatMessageResponse) => {
              if (msg.id === incoming.id) {
                found = true;
                return { ...msg, ...incoming };
              }
              return msg;
            }),
          })),
        };
        if (found) return updated;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, idx: number) =>
            idx === 0 ? { ...page, data: [incoming, ...(page.data || [])] } : page
          ),
        };
      });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!livestreamId) return;

    const backendUrl = getBackendBaseUrl();
    const wsUrl = backendUrl
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:") + "/ws";

    const stompClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      // Chat Topic
      stompClient.subscribe(`/topic/lives/${livestreamId}/chat`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.type === "CHAT" && payload.data) {
            upsertChatMessage(livestreamId, payload.data);
          }
          if (onEvent) onEvent(payload);
        } catch (err) {
          console.error("STOMP parse error:", err);
        }
      });

      // Events Topic (Gifts, Reactions, Moderation, Stream end)
      stompClient.subscribe(`/topic/lives/${livestreamId}/events`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.type === "REACTION") {
            // Optimistic update of like count
            queryClient.setQueryData(["live", livestreamId], (old: any) => {
              if (old?.data) {
                return { ...old, data: { ...old.data, likeCount: payload.count } };
              }
              return old;
            });
          }
          if (payload.type === "STREAM_ENDED") {
            // Mark stream as ended in React Query cache so all subscribers re-render
            queryClient.setQueryData(["live", livestreamId], (old: any) => {
              if (old?.data) {
                return { ...old, data: { ...old.data, status: "ENDED" } };
              }
              return old;
            });
            queryClient.invalidateQueries({ queryKey: ["live", livestreamId] });
            queryClient.invalidateQueries({ queryKey: ["live", "feed"] });
            onStreamEnded?.();
          }
          if (onEvent) onEvent(payload);
        } catch (err) {
          console.error("STOMP parse error:", err);
        }
      });

      // Viewer Count Topic
      stompClient.subscribe(`/topic/lives/${livestreamId}/viewer-count`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.type === "VIEWER_COUNT") {
            queryClient.setQueryData(["live", livestreamId], (old: any) => {
              if (old?.data) {
                return { ...old, data: { ...old.data, viewerCount: payload.viewerCount } };
              }
              return old;
            });
          }
          if (onEvent) onEvent(payload);
        } catch (err) {
          console.error("STOMP parse error:", err);
        }
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [livestreamId, queryClient, upsertChatMessage, onEvent, onStreamEnded]);
};
