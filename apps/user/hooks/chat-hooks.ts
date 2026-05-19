import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as chatService from "@/services/chat-api-service";
import type { ConversationStatus } from "@/types/chat";

export const useConversations = (
  page = 0,
  size = 20,
  status: ConversationStatus = 'ACTIVE',
) => {
  return useQuery({
    queryKey: ['chat', 'conversations', status, page, size],
    queryFn: () => chatService.getConversations(page, size, status),
  });
};

export const useMessages = (conversationId: number | null) => {
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', conversationId],
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
    mutationFn: (data: { conversationId: number; type: string; body?: string; videoId?: number; clientMessageId: string }) => 
      chatService.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
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
  });
};
