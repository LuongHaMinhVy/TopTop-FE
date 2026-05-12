import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as videoService from "@/services/video-api-service";
import { AxiosProgressEvent } from "axios";

export const useAllVideos = () => {
  return useQuery({
    queryKey: ["all-videos"],
    queryFn: () => videoService.getAllVideos(),
  });
};

export const useUserVideos = (userId?: number) => {
  return useQuery({
    queryKey: ["user-videos", userId],
    queryFn: () => videoService.getUserVideos(userId!),
    enabled: !!userId,
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
