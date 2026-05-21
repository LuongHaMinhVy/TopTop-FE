import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as videoService from "@/services/video-api-service";
import * as likeService from "@/services/like-api-service";
import { AxiosProgressEvent } from "axios";
import { QueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/api";
import type { Video, VideoRepostUser } from "@/types/video";

const updateVideoInCache = (queryClient: QueryClient, videoId: number, stats: { liked?: boolean; viewCount?: number; likeCount?: number; isSaved?: boolean; saveCount?: number; shareCount?: number; reposted?: boolean; repostedBy?: VideoRepostUser[] }) => {
  const queryKeys = [
    ["all-videos"],
    ["infinite-videos"],
    ["user-videos"],
    ["liked-videos"],
    ["user-reposted-videos"],
    ["video-detail"],
    ["following-feed"],
    ["friends-feed"],
    ["search-videos"]
  ];

  queryKeys.forEach(key => {
    queryClient.setQueriesData<ApiResponse<Video[]> | ApiResponse<Video> | { pages: ApiResponse<Video[]>[] }>(
      { queryKey: key },
      (oldData) => {
      if (!oldData) return oldData;
      
      if ("pages" in oldData) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data?.map((v) => v.id === videoId ? { 
              ...v, 
              ...(stats.liked !== undefined && { isLiked: stats.liked }), 
              ...(stats.viewCount !== undefined && { viewCount: stats.viewCount }),
              ...(stats.likeCount !== undefined && { likeCount: stats.likeCount }),
              ...(stats.isSaved !== undefined && { isSaved: stats.isSaved }),
              ...(stats.saveCount !== undefined && { saveCount: stats.saveCount }),
              ...(stats.shareCount !== undefined && { shareCount: stats.shareCount }),
              ...(stats.reposted !== undefined && { isReposted: stats.reposted }),
              ...(stats.repostedBy !== undefined && { repostedBy: stats.repostedBy })
            } : v)
          }))
        };
      }
      
      if (oldData.data && Array.isArray(oldData.data)) {
        return {
          ...oldData,
          data: oldData.data.map((v) => v.id === videoId ? { 
          ...v, 
          ...(stats.liked !== undefined && { isLiked: stats.liked }), 
          ...(stats.viewCount !== undefined && { viewCount: stats.viewCount }),
          ...(stats.likeCount !== undefined && { likeCount: stats.likeCount }),
          ...(stats.isSaved !== undefined && { isSaved: stats.isSaved }),
          ...(stats.saveCount !== undefined && { saveCount: stats.saveCount }),
          ...(stats.shareCount !== undefined && { shareCount: stats.shareCount }),
          ...(stats.reposted !== undefined && { isReposted: stats.reposted }),
          ...(stats.repostedBy !== undefined && { repostedBy: stats.repostedBy })
        } : v)
      };
      }
      
      if (oldData.data && !Array.isArray(oldData.data) && oldData.data.id === videoId) {
        return {
          ...oldData,
          data: { 
          ...oldData.data, 
          ...(stats.liked !== undefined && { isLiked: stats.liked }), 
          ...(stats.viewCount !== undefined && { viewCount: stats.viewCount }),
          ...(stats.likeCount !== undefined && { likeCount: stats.likeCount }),
          ...(stats.isSaved !== undefined && { isSaved: stats.isSaved }),
          ...(stats.saveCount !== undefined && { saveCount: stats.saveCount }),
          ...(stats.shareCount !== undefined && { shareCount: stats.shareCount }),
          ...(stats.reposted !== undefined && { isReposted: stats.reposted }),
          ...(stats.repostedBy !== undefined && { repostedBy: stats.repostedBy })
        }
      };
      }
      
      return oldData;
    });
  });
};

export { updateVideoInCache };

export const useAllVideos = () => {
  return useQuery({
    queryKey: ["all-videos"],
    queryFn: () => videoService.getAllVideos(0, 60),
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

export const useUserVideos = (userId?: number, enabled = true) => {
  return useQuery({
    queryKey: ["user-videos", userId],
    queryFn: () => videoService.getUserVideos(userId!),
    enabled: enabled && !!userId,
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

export const useRecordVideoViewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: number) => videoService.recordVideoView(videoId),
    onSuccess: (response, videoId) => {
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
      queryClient.invalidateQueries({ queryKey: ["studio-daily-views"] });
    },
  });
};

export const useStudioDailyViews = (days = 7, enabled = true) => {
  return useQuery({
    queryKey: ["studio-daily-views", days],
    queryFn: () => videoService.getStudioDailyViews(days),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
};

export const useLikeVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.likeVideo(videoId),
    onSuccess: (response, videoId) => {
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
      }
    },
  });
};

export const useUnlikeVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.unlikeVideo(videoId),
    onSuccess: (response, videoId) => {
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
      }
    },
  });
};

export const useRepostVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.repostVideo(videoId),
    onSuccess: (response, videoId) => {
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
        queryClient.invalidateQueries({ queryKey: ["user-reposted-videos"] });
      }
    },
  });
};

export const useUnrepostVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => likeService.unrepostVideo(videoId),
    onSuccess: (response, videoId) => {
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
        queryClient.invalidateQueries({ queryKey: ["user-reposted-videos"] });
      }
    },
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

export const useUpdateVideoMutation = (userId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, payload }: { videoId: number; payload: videoService.UpdateVideoPayload }) => 
      videoService.updateVideo(videoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
    },
  });
};

export const useLikedVideos = (enabled = true) => {
  return useQuery({
    queryKey: ["liked-videos"],
    queryFn: () => videoService.getLikedVideos(0, 100),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUserRepostedVideos = (username?: string, enabled = true) => {
  return useQuery({
    queryKey: ["user-reposted-videos", username],
    queryFn: () => videoService.getUserRepostedVideos(username!, 0, 100),
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
