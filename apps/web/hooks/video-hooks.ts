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
    ["infinite-user-videos"],
    ["liked-videos"],
    ["infinite-liked-videos"],
    ["user-liked-videos"],
    ["infinite-user-liked-videos"],
    ["user-reposted-videos"],
    ["infinite-user-reposted-videos"],
    ["infinite-favorite-videos"],
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

const replaceVideoInCache = (queryClient: QueryClient, video: Video) => {
  const queryKeys = [
    ["all-videos"],
    ["infinite-videos"],
    ["user-videos"],
    ["infinite-user-videos"],
    ["liked-videos"],
    ["infinite-liked-videos"],
    ["user-liked-videos"],
    ["infinite-user-liked-videos"],
    ["user-reposted-videos"],
    ["infinite-user-reposted-videos"],
    ["infinite-favorite-videos"],
    ["video-detail"],
    ["following-feed"],
    ["friends-feed"],
  ];

  queryKeys.forEach((key) => {
    queryClient.setQueriesData<
      ApiResponse<Video[]> | ApiResponse<Video> | { pages: ApiResponse<Video[]>[] }
    >({ queryKey: key }, (oldData) => {
      if (!oldData) return oldData;

      if ("pages" in oldData) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data?.map((item) =>
              item.id === video.id ? { ...item, ...video } : item,
            ),
          })),
        };
      }

      if (oldData.data && Array.isArray(oldData.data)) {
        return {
          ...oldData,
          data: oldData.data.map((item) =>
            item.id === video.id ? { ...item, ...video } : item,
          ),
        };
      }

      if (oldData.data && !Array.isArray(oldData.data) && oldData.data.id === video.id) {
        return {
          ...oldData,
          data: { ...oldData.data, ...video },
        };
      }

      return oldData;
    });
  });
};

const removeVideoFromCache = (queryClient: QueryClient, videoId: number) => {
  const queryKeys = [
    ["all-videos"],
    ["infinite-videos"],
    ["user-videos"],
    ["infinite-user-videos"],
    ["liked-videos"],
    ["infinite-liked-videos"],
    ["infinite-favorite-videos"],
    ["user-reposted-videos"],
    ["infinite-user-reposted-videos"],
    ["following-feed"],
    ["friends-feed"],
  ];

  queryKeys.forEach((key) => {
    queryClient.setQueriesData<ApiResponse<Video[]> | { pages: ApiResponse<Video[]>[] }>(
      { queryKey: key },
      (oldData) => {
        if (!oldData) return oldData;

        if ("pages" in oldData) {
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data?.filter((video) => video.id !== videoId),
            })),
          };
        }

        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((video) => video.id !== videoId),
          };
        }

        return oldData;
      },
    );
  });
};

export { removeVideoFromCache, replaceVideoInCache, updateVideoInCache };

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
      const loadedCount = lastPage.data?.length ?? 0;
      const nextPage = (meta?.page ?? 0) + 1;
      if (meta && nextPage < meta.totalPages) return nextPage;
      if (loadedCount === pageSize) return nextPage;
      return undefined;
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
    onSuccess: (_response, videoId) => {
      removeVideoFromCache(queryClient, videoId);
      queryClient.invalidateQueries({ queryKey: ["user-videos", userId] });
      queryClient.invalidateQueries({ queryKey: ["infinite-user-videos", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["studio-daily-views"] });
    },
  });
};

export const useUploadVideoMutation = () => {
  return useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData, onProgress?: (progressEvent: AxiosProgressEvent) => void }) => 
      videoService.uploadVideo(formData, onProgress),
  });
};

export const useInitVideoUploadMutation = () => {
  return useMutation({
    mutationFn: (payload: videoService.InitVideoUploadPayload) =>
      videoService.initVideoUpload(payload),
  });
};

export const useCompleteVideoUploadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, coverFile }: { payload: videoService.CompleteVideoUploadPayload; coverFile?: File }) =>
      videoService.completeVideoUpload(payload, coverFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
    },
  });
};


export const useReportVideoMutation = () => {
  return useMutation({
    mutationFn: ({ videoId, reason }: { videoId: number; reason: string }) => 
      videoService.reportVideo(videoId, reason),
  });
};

export const useNotInterestedVideoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) => videoService.markVideoNotInterested(videoId),
    onSuccess: (_response, videoId) => {
      removeVideoFromCache(queryClient, videoId);
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends-feed"] });
    },
  });
};

export const useTranslateVideoDescriptionMutation = () => {
  return useMutation({
    mutationFn: ({ videoId, targetLocale }: { videoId: number; targetLocale: string }) =>
      videoService.translateVideoDescription(videoId, targetLocale),
  });
};

export const useRecordVideoViewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, watchDurationMs }: { videoId: number; watchDurationMs?: number }) => 
      videoService.recordVideoView(videoId, watchDurationMs),
    onSuccess: (response, variables) => {
      const videoId = variables.videoId;
      if (response?.data) {
        updateVideoInCache(queryClient, videoId, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-user-videos"] });
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
        queryClient.invalidateQueries({ queryKey: ["infinite-user-reposted-videos"] });
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
        queryClient.invalidateQueries({ queryKey: ["infinite-user-reposted-videos"] });
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
    onSuccess: (response) => {
      if (response.data) {
        replaceVideoInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ["user-videos", userId] });
      queryClient.invalidateQueries({ queryKey: ["infinite-user-videos", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
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

export const useUserLikedVideos = (username?: string, enabled = true) => {
  return useQuery({
    queryKey: ["user-liked-videos", username],
    queryFn: () => videoService.getUserLikedVideos(username!, 0, 100),
    enabled: enabled && !!username,
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

export const useVideoCategoriesQuery = (enabled = true) => {
  return useQuery({
    queryKey: ["video-categories"],
    queryFn: () => videoService.getVideoCategories(),
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteUserVideos = (userId?: number, enabled = true, pageSize = 18) => {
  return useInfiniteQuery({
    queryKey: ["infinite-user-videos", userId, pageSize],
    queryFn: ({ pageParam = 0 }) => videoService.getUserVideos(userId!, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      const loadedCount = lastPage.data?.length ?? 0;
      const nextPage = (meta?.page ?? 0) + 1;
      if (meta && nextPage < meta.totalPages) return nextPage;
      if (loadedCount === pageSize) return nextPage;
      return undefined;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteUserLikedVideos = (username?: string, enabled = true, pageSize = 18) => {
  return useInfiniteQuery({
    queryKey: ["infinite-user-liked-videos", username, pageSize],
    queryFn: ({ pageParam = 0 }) => videoService.getUserLikedVideos(username!, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      const loadedCount = lastPage.data?.length ?? 0;
      const nextPage = (meta?.page ?? 0) + 1;
      if (meta && nextPage < meta.totalPages) return nextPage;
      if (loadedCount === pageSize) return nextPage;
      return undefined;
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteLikedVideos = (enabled = true, pageSize = 18) => {
  return useInfiniteQuery({
    queryKey: ["infinite-liked-videos", pageSize],
    queryFn: ({ pageParam = 0 }) => videoService.getLikedVideos(pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      const loadedCount = lastPage.data?.length ?? 0;
      const nextPage = (meta?.page ?? 0) + 1;
      if (meta && nextPage < meta.totalPages) return nextPage;
      if (loadedCount === pageSize) return nextPage;
      return undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteUserRepostedVideos = (username?: string, enabled = true, pageSize = 18) => {
  return useInfiniteQuery({
    queryKey: ["infinite-user-reposted-videos", username, pageSize],
    queryFn: ({ pageParam = 0 }) => videoService.getUserRepostedVideos(username!, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      const loadedCount = lastPage.data?.length ?? 0;
      const nextPage = (meta?.page ?? 0) + 1;
      if (meta && nextPage < meta.totalPages) return nextPage;
      if (loadedCount === pageSize) return nextPage;
      return undefined;
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

