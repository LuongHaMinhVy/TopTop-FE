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
