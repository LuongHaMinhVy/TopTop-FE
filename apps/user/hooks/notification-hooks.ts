import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "@/services/notification-api-service";

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.getNotifications,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled,
  });
};

export const useUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: enabled ? 60000 : false,
    enabled,
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
