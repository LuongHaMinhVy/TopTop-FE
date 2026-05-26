"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, followUser, unfollowUser, getFollowingList, blockUser, unblockUser, updateProfile, uploadAvatar, getMentionSuggestions } from "@/services/user-api-service";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import type { QueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/api";
import type { SearchTopResult, SearchUser } from "@/types/search";
import type { UserInfo } from "@/types/user";

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

function updateUserProfileRelationship(
  queryClient: QueryClient,
  username: string,
  updates: Partial<NonNullable<UserInfo["relationship"]>>,
) {
  queryClient.setQueriesData<ApiResponse<UserInfo>>(
    { queryKey: ["userProfile", username] },
    (current) => {
      if (!current?.data) return current;
      return {
        ...current,
        data: {
          ...current.data,
          relationship: {
            ...(current.data.relationship ?? {}),
            ...updates,
          },
          followersCount:
            updates.isFollowing === undefined
              ? current.data.followersCount
              : Math.max(
                  0,
                  (current.data.followersCount ?? 0) +
                    (updates.isFollowing ? 1 : -1),
                ),
        },
      };
    },
  );
}

function updateSearchUserFollowState(
  queryClient: QueryClient,
  username: string,
  followed: boolean,
) {
  const updateUser = (user: SearchUser): SearchUser =>
    user.username === username
      ? {
          ...user,
          followed,
          followerCount: Math.max(
            0,
            user.followerCount + (followed ? 1 : -1),
          ),
        }
      : user;

  queryClient.setQueriesData<ApiResponse<SearchUser[]>>(
    { queryKey: ["search", "users"] },
    (current) =>
      current?.data
        ? { ...current, data: current.data.map(updateUser) }
        : current,
  );

  queryClient.setQueriesData<ApiResponse<SearchTopResult>>(
    { queryKey: ["search", "top"] },
    (current) =>
      current?.data
        ? {
            ...current,
            data: {
              ...current.data,
              users: current.data.users.map(updateUser),
              videos: current.data.videos.map((video) => ({
                ...video,
                author: updateUser(video.author),
              })),
            },
          }
        : current,
  );
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
      updateUserProfileRelationship(queryClient, username, {
        isFollowing: true,
      });
      updateSearchUserFollowState(queryClient, username, true);
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    }
  });
}

export function useUnfollowMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(username),
    onSuccess: () => {
      updateUserProfileRelationship(queryClient, username, {
        isFollowing: false,
        isFriend: false,
      });
      updateSearchUserFollowState(queryClient, username, false);
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    }
  });
}

export function useDynamicFollowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => followUser(username),
    onSuccess: (_, username) => {
      updateUserProfileRelationship(queryClient, username, {
        isFollowing: true,
      });
      updateSearchUserFollowState(queryClient, username, true);
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["following-list"] });
      queryClient.invalidateQueries({ queryKey: ["following-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends-count"] });
      queryClient.invalidateQueries({ queryKey: ["friends-feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends-suggestions"] });
    }
  });
}

export function useDynamicUnfollowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => unfollowUser(username),
    onSuccess: (_, username) => {
      updateUserProfileRelationship(queryClient, username, {
        isFollowing: false,
        isFriend: false,
      });
      updateSearchUserFollowState(queryClient, username, false);
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["following-list"] });
      queryClient.invalidateQueries({ queryKey: ["following-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends-count"] });
      queryClient.invalidateQueries({ queryKey: ["friends-feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends-suggestions"] });
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

export function useFollowingList(enabled = true) {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  return useQuery({
    queryKey: ["following-list", currentUserId ?? "anonymous"],
    queryFn: () => getFollowingList(),
    staleTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
    enabled,
  });
}

export function useMentionSuggestions(keyword?: string, enabled = true) {
  return useQuery({
    queryKey: ["mention-suggestions", keyword ?? ""],
    queryFn: () => getMentionSuggestions(keyword),
    staleTime: 60 * 1000,
    enabled,
  });
}
