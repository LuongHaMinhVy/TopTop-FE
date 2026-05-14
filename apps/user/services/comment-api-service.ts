import axios from "axios";
import type { ApiResponse } from "@/types/api";

export interface CommentResponse {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  username: string;
  userAvatarUrl?: string;
  videoId: number;
  parentId?: number;
}

const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL + "/api/v1/comments";

export const addComment = async ({ videoId, content, parentId }: { videoId: number; content: string; parentId?: number }) => {
  const response = await axios.post<ApiResponse<CommentResponse>>(`${API_URL}/video/${videoId}`, {
    content,
    parentId
  });
  return response.data;
};

export const getComments = async (videoId: number) => {
  const response = await axios.get<ApiResponse<CommentResponse[]>>(`${API_URL}/video/${videoId}`);
  return response.data;
};

export const deleteComment = async (id: number) => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/${id}`);
  return response.data;
};
