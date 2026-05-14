import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as videoService from "@/services/video-api-service";
import * as likeService from "@/services/like-api-service";
import { AxiosProgressEvent } from "axios";

export const useAllVideos = () => {
  return useQuery({
    queryKey: ["all-videos"],
    queryFn: () => videoService.getAllVideos(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteVideos = (pageSize = 3) => {
  return useInfiniteQuery({
    queryKey: ["infinite-videos", pageSize],
    queryFn: ({ pageParam = 0 }) => videoService.getAllVideos(pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      const nextPage = meta.page + 1;
      return nextPage < meta.totalPages ? nextPage : undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUserVideos = (userId?: number) => {
  return useQuery({
    queryKey: ["user-videos", userId],
    queryFn: () => videoService.getUserVideos(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteVideoMutation = (userId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => videoService.deleteVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos", userId] });
    },
  });
};

export const useUploadVideoMutation = () => {
  return useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData, onProgress?: (progressEvent: AxiosProgressEvent) => void }) => 
      videoService.uploadVideo(formData, onProgress),
  });
};

export const useReportVideoMutation = () => {
  return useMutation({
    mutationFn: ({ videoId, reason }: { videoId: number; reason: string }) => 
      videoService.reportVideo(videoId, reason),
  });
};

export const useLikeVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.likeVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
    },
  });
};

export const useUnlikeVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.unlikeVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
    },
  });
};

export const useFavoriteVideos = () => {
  return useQuery({
    queryKey: ["favorite-videos"],
    queryFn: () => videoService.getFavoriteVideos(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useVideoDetail = (username: string, videoId: number) => {
  return useQuery({
    queryKey: ["video-detail", username, videoId],
    queryFn: () => videoService.getVideoByUsernameAndId(username, videoId),
    enabled: !!username && !!videoId,
    staleTime: 30_000,
  });
};
