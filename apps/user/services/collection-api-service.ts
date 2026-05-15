import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video } from "@/types/video";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  VideoCollection,
} from "@/types/collection";

export const getFavoriteVideos = async (page = 0, size = 12): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/collections/favorites/videos", {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const saveVideo = async (videoId: number): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.post<ApiResponse<Video>>(`/collections/favorites/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unsaveVideo = async (videoId: number): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.delete<ApiResponse<Video>>(`/collections/favorites/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getCollections = async (): Promise<ApiResponse<VideoCollection[]>> => {
  try {
    const response = await api.get<ApiResponse<VideoCollection[]>>("/collections");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserCollections = async (username: string): Promise<ApiResponse<VideoCollection[]>> => {
  try {
    const response = await api.get<ApiResponse<VideoCollection[]>>(`/users/${username}/collections`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getCollectionDetail = async (
  username: string,
  collectionId: number
): Promise<ApiResponse<VideoCollection>> => {
  try {
    const response = await api.get<ApiResponse<VideoCollection>>(`/users/${username}/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const createCollection = async (
  payload: CreateCollectionRequest
): Promise<ApiResponse<VideoCollection>> => {
  try {
    const response = await api.post<ApiResponse<VideoCollection>>("/collections", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const updateCollection = async (
  collectionId: number,
  payload: UpdateCollectionRequest
): Promise<ApiResponse<VideoCollection>> => {
  try {
    const response = await api.patch<ApiResponse<VideoCollection>>(`/collections/${collectionId}`, payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const deleteCollection = async (collectionId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getCollectionVideos = async (
  collectionId: number,
  page = 0,
  size = 12
): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/collections/${collectionId}/videos`, {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserCollectionVideos = async (
  username: string,
  collectionId: number,
  page = 0,
  size = 18
): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/users/${username}/collections/${collectionId}/videos`, {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const addVideoToCollection = async (
  collectionId: number,
  videoId: number
): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.post<ApiResponse<Video>>(`/collections/${collectionId}/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const removeVideoFromCollection = async (
  collectionId: number,
  videoId: number
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/collections/${collectionId}/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
