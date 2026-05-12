import { AxiosError, AxiosProgressEvent } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video } from "@/types/video";

export const getAllVideos = async (): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/videos");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserVideos = async (userId: number): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/videos/user/${userId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const deleteVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const uploadVideo = async (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.post<ApiResponse<Video>>("/videos/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
