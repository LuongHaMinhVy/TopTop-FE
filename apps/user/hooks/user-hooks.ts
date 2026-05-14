"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, followUser, unfollowUser, getFollowingList } from "@/services/user-api-service";

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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

export function useFollowingList() {
  return useQuery({
    queryKey: ["following-list"],
    queryFn: () => getFollowingList(),
    staleTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
  });
}
