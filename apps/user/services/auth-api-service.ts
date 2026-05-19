import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { LoginRequest, RegisterRequest, ResetPasswordRequest, AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

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

export const authRegister = async (
  payload: RegisterRequest
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/register", payload);
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

export const authVerifyEmail = async (token: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/verify-email", null, {
      params: { token },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const authResendVerification = async (email: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/resend-verification", null, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const authForgotPassword = async (email: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/forgot-password", null, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const authResetPassword = async (
  payload: ResetPasswordRequest
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>("/auth/reset-password", payload);
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

export const oauth2Exchange = async (state: string): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.get<ApiResponse<AuthResponse>>(`/auth/oauth2/exchange?state=${state}&X-App-Id=toptopuser`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const oauth2Onboard = async (
  payload: { username: string; dateOfBirth: string },
  accessToken?: string
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/oauth2/onboard", payload, { headers });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};