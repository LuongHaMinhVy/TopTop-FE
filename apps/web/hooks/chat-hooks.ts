/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as chatService from "@/services/chat-api-service";
import type { ConversationStatus, MessageResponseDTO } from "@/types/chat";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { getBackendBaseUrl } from "@/utils/axios-instance";

export const useConversations = (
  page = 0,
  size = 20,
  status: ConversationStatus = 'ACTIVE',
) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  return useQuery({
    queryKey: ['chat', 'conversations', currentUserId ?? 'anonymous', status, page, size],
    queryFn: () => chatService.getConversations(page, size, status),
    refetchInterval: 4000, // poll conversation list every 4 seconds
    refetchIntervalInBackground: false,
  });
};

export const useMessages = (conversationId: number | null) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', currentUserId ?? 'anonymous', conversationId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => 
      conversationId ? chatService.getMessages(conversationId, pageParam as number) : Promise.reject('No conversation ID'),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.page < lastPage.meta.totalPages - 1) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    enabled: !!conversationId,
    refetchInterval: 8000, // longer poll as fallback — WebSocket handles realtime
    refetchIntervalInBackground: false,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: number) => chatService.createDirectConversation(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  return useMutation({
    mutationFn: (data: {
      conversationId: number;
      type: string;
      body?: string;
      videoId?: number;
      mediaUrl?: string;
      mediaType?: string;
      fileName?: string;
      fileSize?: number;
      clientMessageId: string;
    }) => chatService.sendMessage(data),
    
    onMutate: async (newData) => {
      if (!currentUserId) return;

      const queryKey = ['chat', 'messages', currentUserId, newData.conversationId];

      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData(queryKey);

      const optimisticMessage: MessageResponseDTO = {
        id: Math.round(Math.random() * -1000000), // temp negative ID
        conversationId: newData.conversationId,
        senderId: currentUserId,
        type: newData.type as any,
        body: newData.body,
        status: 'SENT',
        mine: true,
        clientMessageId: newData.clientMessageId,
        createdAt: new Date().toISOString(),
        attachment: newData.mediaUrl || newData.videoId ? {
          type: newData.mediaType || (newData.type === 'VIDEO_SHARE' ? 'VIDEO_POST' : 'IMAGE'),
          url: newData.mediaUrl,
          videoId: newData.videoId,
          fileName: newData.fileName,
          fileSize: newData.fileSize,
        } : undefined
      };

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) {
          return {
            pages: [{ data: [optimisticMessage], meta: { page: 0, size: 20, totalPages: 1, totalElements: 1 } }],
            pageParams: [0]
          };
        }
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                data: [optimisticMessage, ...(page.data || [])]
              };
            }
            return page;
          })
        };
      });

      return { previousMessages, queryKey };
    },
    
    onError: (_err, _newData, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },
    
    onSettled: (_data, _error, variables) => {
      // Always refetch after mutation settles to ensure consistency
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: ['chat', 'messages', currentUserId, variables.conversationId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }: { messageId: number; conversationId: number }) =>
      chatService.deleteMessage(messageId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.conversationId], exact: false });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => chatService.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });
};

export const useChatUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => chatService.getUnreadCount(),
    enabled,
    refetchInterval: 6000, // update unread badges every 6 seconds
  });
};

export const useShareVideoToChats = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userIds, videoId, message }: { userIds: number[]; videoId: number; message?: string }) => {
      const trimmedMessage = message?.trim();
      const shareJobs = userIds.map(async (userId) => {
        const convRes = await chatService.createDirectConversation(userId);
        if (!convRes.data) {
          throw new Error("Không thể tạo cuộc trò chuyện.");
        }

        return chatService.sendMessage({
          conversationId: convRes.data.id,
          type: 'VIDEO_SHARE',
          videoId,
          body: trimmedMessage || undefined,
          clientMessageId: crypto.randomUUID()
        });
      });

      const settledResults = await Promise.allSettled(shareJobs);
      const fulfilledResults = settledResults
        .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof chatService.sendMessage>>> => result.status === "fulfilled")
        .map((result) => result.value);
      const failedReasons = settledResults
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

      const failedCount = settledResults.length - fulfilledResults.length;
      if (failedCount > 0) {
        throw new Error(
          fulfilledResults.length > 0
            ? `Đã gửi ${fulfilledResults.length}/${userIds.length} người nhận. ${failedCount} người nhận thất bại.`
            : failedReasons[0] || "Không thể chia sẻ video. Vui lòng thử lại.",
        );
      }

      return fulfilledResults;
    },
    onSuccess: (_results, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['all-videos'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-videos'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-detail'] });
      queryClient.invalidateQueries({ queryKey: ['studio-comments', variables.videoId] });
    }
  });
};

/**
 * Connects to the backend STOMP WebSocket and subscribes to the conversation
 * topic. Incoming messages are merged into the React-Query cache so the UI
 * updates instantly without waiting for the next HTTP poll.
 */
export const useChatSocket = (conversationId: number | null) => {
  const queryClient = useQueryClient();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  // Stable helper – upserts a message into the infinite-query cache.
  // If a message with the same clientMessageId already exists it is
  // replaced (optimistic → real); otherwise it is prepended to page 0.
  const upsertMessage = useCallback(
    (convId: number, incoming: MessageResponseDTO) => {
      if (!currentUserId) return;
      const queryKey = ['chat', 'messages', currentUserId, convId];

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        // Check whether this message is already present (by server id OR clientMessageId)
        let found = false;
        const updated = {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: MessageResponseDTO) => {
              if (
                (incoming.id && msg.id === incoming.id) ||
                (incoming.clientMessageId && msg.clientMessageId === incoming.clientMessageId)
              ) {
                found = true;
                return { ...msg, ...incoming }; // merge – keeps local blob url until replaced
              }
              return msg;
            }),
          })),
        };

        if (found) return updated;

        // Not found → prepend to page 0
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, idx: number) =>
            idx === 0
              ? { ...page, data: [incoming, ...(page.data || [])] }
              : page
          ),
        };
      });
    },
    [currentUserId, queryClient],
  );

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const backendUrl = getBackendBaseUrl();
    const wsUrl = backendUrl
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:") + "/ws";

    const stompClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {
        // silent in production; uncomment for debugging:
        // console.log("[STOMP]", str);
      },
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/chat.${conversationId}`, (frame) => {
        try {
          const eventData = JSON.parse(frame.body);

          if (eventData.event === "chat.message.new" && eventData.message) {
            upsertMessage(conversationId, eventData.message);

            // Refresh conversation sidebar (last-message preview, unread, etc.)
            queryClient.invalidateQueries({
              queryKey: ['chat', 'conversations'],
            });
          }
        } catch (err) {
          console.error("[STOMP] Failed to parse frame:", err);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("[STOMP] Broker error:", frame.headers['message'], frame.body);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [conversationId, currentUserId, queryClient, upsertMessage]);
};
