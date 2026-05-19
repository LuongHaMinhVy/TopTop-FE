import { ApiResponse } from "@/types/api";
import api from "@/utils/axios-instance";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";
import type { 
  ConversationResponseDTO, 
  ConversationStatus,
  MessageResponseDTO, 
  UnreadCountResponseDTO 
} from "@/types/chat";

export const getConversations = async (
  page = 0,
  size = 20,
  status: ConversationStatus = "ACTIVE",
): Promise<ApiResponse<ConversationResponseDTO[]>> => {
  try {
    const response = await api.get<ApiResponse<ConversationResponseDTO[]>>(
      `/chat/conversations?page=${page}&size=${size}&status=${status}`,
    );
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getMessages = async (conversationId: number, page = 0, size = 30): Promise<ApiResponse<MessageResponseDTO[]>> => {
  try {
    const response = await api.get<ApiResponse<MessageResponseDTO[]>>(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const createDirectConversation = async (targetUserId: number): Promise<ApiResponse<ConversationResponseDTO>> => {
  try {
    const response = await api.post<ApiResponse<ConversationResponseDTO>>('/chat/conversations/direct', { targetUserId });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const sendMessage = async (data: { conversationId: number; type: string; body?: string; videoId?: number; clientMessageId: string }): Promise<ApiResponse<MessageResponseDTO>> => {
  try {
    const response = await api.post<ApiResponse<MessageResponseDTO>>('/chat/messages', data);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const markAsRead = async (conversationId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/chat/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUnreadCount = async (): Promise<ApiResponse<UnreadCountResponseDTO>> => {
  try {
    const response = await api.get<ApiResponse<UnreadCountResponseDTO>>('/chat/conversations/unread-count');
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
