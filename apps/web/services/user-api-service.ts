import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { ContentFilterTag, UserInfo } from "@/types/user";

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

export const getBlockedUsers = async (): Promise<ApiResponse<UserInfo[]>> => {
  try {
    const response = await api.get<ApiResponse<UserInfo[]>>("/blocks");
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

export interface UpdatePrivacySettingsPayload {
  isPrivate?: boolean;
  allowComments?: boolean;
  allowMessageFromEveryone?: boolean;
  showPosts?: boolean;
  showReposts?: boolean;
  showLikedVideos?: boolean;
  showFavorites?: boolean;
}

export const updatePrivacySettings = async (
  payload: UpdatePrivacySettingsPayload
): Promise<ApiResponse<UserInfo>> => {
  try {
    const response = await api.patch<ApiResponse<UserInfo>>("/users/settings/privacy", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResponse<void>> => {
  try {
    const response = await api.patch<ApiResponse<void>>("/users/settings/password", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export type AccountStatusAction = "DEACTIVATE" | "DELETE";

export const sendAccountStatusOtp = async (payload: {
  action: AccountStatusAction;
}): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/users/settings/account-status/otp", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const confirmAccountStatus = async (payload: {
  otp: string;
  action: AccountStatusAction;
}): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/users/settings/account-status/confirm", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getContentFilterTags = async (): Promise<ApiResponse<ContentFilterTag[]>> => {
  try {
    const response = await api.get<ApiResponse<ContentFilterTag[]>>("/users/settings/content-filters");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const addContentFilterTag = async (payload: {
  tag: string;
  sampleThumbnailUrl?: string | null;
}): Promise<ApiResponse<ContentFilterTag>> => {
  try {
    const response = await api.post<ApiResponse<ContentFilterTag>>("/users/settings/content-filters", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const deleteContentFilterTag = async (tag: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/users/settings/content-filters/${encodeURIComponent(tag)}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

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
