import { AxiosError, AxiosProgressEvent } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video } from "@/types/video";

export const getAllVideos = async (page = 0, size = 2): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/videos", {
      params: { page, size }
    });
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

export const reportVideo = async (videoId: number, reason: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/report`, { reason });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const likeVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unlikeVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getVideoByUsernameAndId = async (username: string, videoId: number): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.get<ApiResponse<Video>>(`/videos/@${username}/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface UpdateVideoPayload {
  title: string;
  description?: string;
  category?: string;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  allowComments?: boolean;
  allowEdit?: boolean;
}

export const updateVideo = async (videoId: number, payload: UpdateVideoPayload): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.put<ApiResponse<Video>>(`/videos/${videoId}`, payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getLikedVideos = async (page = 0, size = 18): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/videos/liked", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserRepostedVideos = async (username: string, page = 0, size = 18): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/videos/users/${username}/reposts`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
