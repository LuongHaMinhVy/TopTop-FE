import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as chatService from "@/services/chat-api-service";

export const useConversations = (page = 0, size = 20) => {
  return useQuery({
    queryKey: ['chat', 'conversations', page, size],
    queryFn: () => chatService.getConversations(page, size),
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

export const useChatUnreadCount = () => {
  return useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => chatService.getUnreadCount(),
  });
};
