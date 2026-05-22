import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Sound, SoundDetail, SoundStats, SoundType } from "@/types/sound";
import type { Video } from "@/types/video";

interface SoundListParams {
  keyword?: string;
  type?: SoundType;
  page?: number;
  size?: number;
}

export const getSounds = async (params: SoundListParams = {}): Promise<ApiResponse<Sound[]>> => {
  try {
    const response = await api.get<ApiResponse<Sound[]>>("/sounds", { params });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getSoundDetail = async (soundId: number): Promise<ApiResponse<SoundDetail>> => {
  try {
    const response = await api.get<ApiResponse<SoundDetail>>(`/sounds/${soundId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getSoundVideos = async (
  soundId: number,
  page = 0,
  size = 20,
): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/sounds/${soundId}/videos`, {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFavoriteSounds = async (page = 0, size = 20): Promise<ApiResponse<Sound[]>> => {
  try {
    const response = await api.get<ApiResponse<Sound[]>>("/sounds/favorites", {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const saveSound = async (soundId: number): Promise<ApiResponse<SoundStats>> => {
  try {
    const response = await api.post<ApiResponse<SoundStats>>(`/sounds/${soundId}/save`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unsaveSound = async (soundId: number): Promise<ApiResponse<SoundStats>> => {
  try {
    const response = await api.delete<ApiResponse<SoundStats>>(`/sounds/${soundId}/save`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
