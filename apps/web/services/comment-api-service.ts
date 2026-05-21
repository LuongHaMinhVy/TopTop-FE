import type { ApiResponse } from "@/types/api";
import api from "@/utils/axios-instance";
import type { CommentLikeResponse, CommentResponse, CreateCommentRequest } from "@/types/comment";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";

export const addComment = async ({ videoId, content, mediaUrl, mediaType, parentId, timestampInVideo }: CreateCommentRequest) => {
  try {
    const response = await api.post<ApiResponse<CommentResponse>>(`/videos/${videoId}/comments`, {
      content,
      mediaUrl,
      mediaType,
      parentId,
      timestampInVideo,
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getComments = async (videoId: number) => {
  try {
    const response = await api.get<ApiResponse<CommentResponse[]>>(`/videos/${videoId}/comments`, {
      params: { page: 0, size: 20 },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getReplies = async (commentId: number, size = 10) => {
  try {
    const response = await api.get<ApiResponse<CommentResponse[]>>(`/comments/${commentId}/replies`, {
      params: { page: 0, size },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const addReply = async ({ commentId, content, mediaUrl, mediaType }: { commentId: number; content: string; mediaUrl?: string | null; mediaType?: "IMAGE" | null }) => {
  try {
    const response = await api.post<ApiResponse<CommentResponse>>(`/comments/${commentId}/replies`, { content, mediaUrl, mediaType });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const deleteComment = async (id: number) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/comments/${id}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const likeComment = async (commentId: number) => {
  try {
    const response = await api.post<ApiResponse<CommentLikeResponse>>(`/comments/${commentId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unlikeComment = async (commentId: number) => {
  try {
    const response = await api.delete<ApiResponse<CommentLikeResponse>>(`/comments/${commentId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
