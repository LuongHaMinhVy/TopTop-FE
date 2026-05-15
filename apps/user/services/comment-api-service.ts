import type { ApiResponse } from "@/types/api";
import api from "@/utils/axios-instance";
import type { CommentResponse } from "@/types/comment";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";

export const addComment = async ({ videoId, content, parentId }: { videoId: number; content: string; parentId?: number }) => {
  try {
    const response = await api.post<ApiResponse<CommentResponse>>(`/comments/video/${videoId}`, {
      content,
      parentId
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getComments = async (videoId: number) => {
  try {
    const response = await api.get<ApiResponse<CommentResponse[]>>(`/comments/video/${videoId}`);
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
