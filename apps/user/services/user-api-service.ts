import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { UserInfo } from "@/types/user";

export const getCurrentUser = async (): Promise<ApiResponse<UserInfo>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo>>("/users/me");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserProfile = async (username: string): Promise<ApiResponse<UserInfo>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo>>(`/users/${username}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
export const followUser = async (username: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/follow/${username}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unfollowUser = async (username: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/follow/${username}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const blockUser = async (username: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/blocks/${username}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unblockUser = async (username: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/blocks/${username}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getFollowingList = async (): Promise<ApiResponse<UserInfo[]>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo[]>>("/follow/following");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

import type { MentionSuggestion } from "@/types/mention";

export const getMentionSuggestions = async (keyword?: string): Promise<ApiResponse<MentionSuggestion[]>> => {
  try {
    const params = keyword ? { keyword } : {};
    const response = await api.get<ApiResponse<MentionSuggestion[]>>("/users/mentions", { params });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface UpdateProfilePayload {
  username: string;
  nickname: string;
  bio?: string;
  avatarUrl?: string;
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ApiResponse<UserInfo>> => {
  try {
    const response = await api.put<ApiResponse<UserInfo>>("/users/profile", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const uploadAvatar = async (file: File): Promise<ApiResponse<string>> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<string>>("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
