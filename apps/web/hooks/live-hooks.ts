/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as liveService from "@/services/live-api-service";
import type { ApiResponse } from "@/types/api";
import type { CreateLivestreamRequest, SendChatMessageRequest, SendGiftRequest, LiveChatMessageResponse, LivestreamResponse } from "@/types/live";
import { useEffect, useCallback } from "react";
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
    refetchInterval: 10000, // Background poll to update viewer counts etc. if socket disconnects
  });
};

export const useMyLivestreams = () => {
  return useQuery({
    queryKey: ["live", "me"],
    queryFn: liveService.getMyLivestreams,
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

export const useSendLiveMessage = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SendChatMessageRequest }) => liveService.sendChatMessage(id, data),
    // Socket handles updating the UI, but we could optimistic update here
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

// ── WebSockets ───────────────────────────────────────────────────────────────

export const useLiveSocket = (
  livestreamId: number | null,
  onEvent?: (event: any) => void
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
  }, [livestreamId, queryClient, upsertChatMessage, onEvent]);
};
