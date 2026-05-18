import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as collectionService from "@/services/collection-api-service";
import type { CreateCollectionRequest, UpdateCollectionRequest } from "@/types/collection";

export const useFavoriteVideos = (enabled = true) => {
  return useQuery({
    queryKey: ["favorite-videos"],
    queryFn: () => collectionService.getFavoriteVideos(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCollections = (enabled = true) => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => collectionService.getCollections(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUserCollections = (username?: string, enabled = true) => {
  return useQuery({
    queryKey: ["user-collections", username],
    queryFn: () => collectionService.getUserCollections(username!),
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCollectionDetail = (username?: string, collectionId?: number) => {
  return useQuery({
    queryKey: ["collection-detail", username, collectionId],
    queryFn: () => collectionService.getCollectionDetail(username!, collectionId!),
    enabled: !!username && !!collectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCollectionVideos = (collectionId?: number) => {
  return useQuery({
    queryKey: ["collection-videos", collectionId],
    queryFn: () => collectionService.getCollectionVideos(collectionId!),
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const usePublicCollectionVideos = (
  username?: string,
  collectionId?: number,
  enabled = true,
  page = 0,
  size = 18,
) => {
  return useQuery({
    queryKey: ["public-collection-videos", username, collectionId, page, size],
    queryFn: () =>
      collectionService.getUserCollectionVideos(username!, collectionId!, page, size),
    enabled: enabled && !!username && !!collectionId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useSaveVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => collectionService.saveVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
    },
  });
};

export const useUnsaveVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => collectionService.unsaveVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
    },
  });
};

export const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCollectionRequest) => collectionService.createCollection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
    },
  });
};

export const useUpdateCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, payload }: { collectionId: number; payload: UpdateCollectionRequest }) =>
      collectionService.updateCollection(collectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-detail"] });
    },
  });
};

export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: number) => collectionService.deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection-videos"] });
    },
  });
};

export const useAddVideoToCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, videoId }: { collectionId: number; videoId: number }) =>
      collectionService.addVideoToCollection(collectionId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-videos"] });
    },
  });
};

export const useRemoveVideoFromCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, videoId }: { collectionId: number; videoId: number }) =>
      collectionService.removeVideoFromCollection(collectionId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection-videos"] });
    },
  });
};

export const useBulkRemoveCollectionVideosMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, videoIds }: { collectionId: number; videoIds: number[] }) => {
      await Promise.all(videoIds.map((videoId) => collectionService.removeVideoFromCollection(collectionId, videoId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["user-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-videos"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection-videos"] });
    },
  });
};
