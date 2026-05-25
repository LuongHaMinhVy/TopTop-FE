import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as chatService from "@/services/chat-api-service";
import type { ConversationStatus } from "@/types/chat";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

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
    refetchInterval: 3000, // poll active chat messages every 3 seconds for near-realtime updates
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
  return useMutation({
    mutationFn: (data: { conversationId: number; type: string; body?: string; videoId?: number; mediaUrl?: string; mediaType?: string; fileName?: string; fileSize?: number; clientMessageId: string }) => 
      chatService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
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
