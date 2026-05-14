import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api";

export interface Notification {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actorId: number;
  actorUsername: string;
  actorAvatarUrl?: string;
  videoId?: number;
  videoThumbnailUrl?: string;
}

export const getNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  try {
    const response = await api.get<ApiResponse<Notification[]>>("/notifications");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUnreadCount = async (): Promise<ApiResponse<number>> => {
  try {
    const response = await api.get<ApiResponse<number>>("/notifications/unread-count");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const markAsRead = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
