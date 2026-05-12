"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, followUser, unfollowUser } from "@/services/user-api-service";

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
    retry: false,
    staleTime: 5 * 60 * 1000
  });
}

export function useFollowMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
    }
  });
}

export function useUnfollowMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
    }
  });
}
