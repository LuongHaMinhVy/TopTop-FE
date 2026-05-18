import api from "@/utils/axios-instance";
import type { ApiResponse } from "@/types/api";
import type { VideoStatsResponse } from "@/types/video-like";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";

export const likeVideo = async (videoId: number) => {
  try {
    const response = await api.post<ApiResponse<VideoStatsResponse>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unlikeVideo = async (videoId: number) => {
  try {
    const response = await api.delete<ApiResponse<VideoStatsResponse>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
