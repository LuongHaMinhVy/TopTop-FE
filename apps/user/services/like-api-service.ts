import axios from "axios";
import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL + "/api/v1/videos";

export const likeVideo = async (videoId: number) => {
  const response = await axios.post<ApiResponse<void>>(`${API_URL}/${videoId}/like`);
  return response.data;
};

export const unlikeVideo = async (videoId: number) => {
  const response = await axios.post<ApiResponse<void>>(`${API_URL}/${videoId}/unlike`);
  return response.data;
};
