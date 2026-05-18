"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, followUser, unfollowUser, getFollowingList, blockUser, unblockUser, updateProfile, uploadAvatar } from "@/services/user-api-service";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";

export function useUploadAvatarMutation() {
  return useMutation({
    mutationFn: uploadAvatar,
  });
}

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

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data;
      if (updatedUser) {
        dispatch(setCredentials(updatedUser));
        queryClient.invalidateQueries({ queryKey: ["userProfile", updatedUser.username] });
      }
    }
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

function invalidateRelationshipQueries(queryClient: ReturnType<typeof useQueryClient>, username: string) {
  queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
  queryClient.invalidateQueries({ queryKey: ["following-list"] });
  queryClient.invalidateQueries({ queryKey: ["user-videos"] });
  queryClient.invalidateQueries({ queryKey: ["all-videos"] });
  queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
  queryClient.invalidateQueries({ queryKey: ["video-detail"] });
}

export function useBlockUserMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => blockUser(username),
    onSuccess: () => invalidateRelationshipQueries(queryClient, username),
  });
}

export function useUnblockUserMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unblockUser(username),
    onSuccess: () => invalidateRelationshipQueries(queryClient, username),
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
