import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Sound, SoundDetail, SoundType } from "@/types/sound";
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
