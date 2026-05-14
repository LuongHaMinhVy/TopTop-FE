import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "@/services/notification-api-service";

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.getNotifications,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60000, 
  });
};

export const useMarkReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });
};
