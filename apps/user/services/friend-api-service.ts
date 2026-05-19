import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video } from "@/types/video";
import type { UserInfo } from "@/types/user";

export const getFriendsFeed = async (page = 0, size = 10): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/friends/feed", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFriendsSuggestions = async (page = 0, size = 12): Promise<ApiResponse<UserInfo[]>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo[]>>("/friends/suggestions", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFriendsCount = async (): Promise<ApiResponse<number>> => {
  try {
    const response = await api.get<ApiResponse<number>>("/friends/count");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
