import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video } from "@/types/video";
import type { UserInfo } from "@/types/user";

export interface FollowingTraySummary {
  liveCount: number;
  storyCount: number;
  items: any[];
}

export const getFollowingFeed = async (page = 0, size = 10): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/following/feed", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFollowingSuggestions = async (page = 0, size = 12): Promise<ApiResponse<UserInfo[]>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo[]>>("/following/suggestions", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFollowingTray = async (): Promise<ApiResponse<FollowingTraySummary>> => {
  try {
    const response = await api.get<ApiResponse<FollowingTraySummary>>("/following/tray");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
