import api from "@/utils/axios-instance";
import type { ApiResponse } from "@/types/api";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";

export const likeVideo = async (videoId: number) => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unlikeVideo = async (videoId: number) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
