import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { LoginRequest } from "@/utils/interfaces";
import type { ApiResponse, AuthResponse } from "@/utils/interfaces";

export const authLogin = async (
  payload: LoginRequest
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const authLogout = async (): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/logout");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const authRefresh = async (): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/refresh");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
