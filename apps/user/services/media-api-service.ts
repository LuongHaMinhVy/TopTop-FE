import type { ApiResponse } from "@/types/api";
import api from "@/utils/axios-instance";
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";

export interface MediaUploadResponse {
  url: string;
  type: "IMAGE" | "VIDEO";
  contentType?: string;
  fileName?: string;
  fileSize?: number;
}

export const uploadMedia = async (file: File, context: "chat" | "comment" = "chat") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", context);
    const response = await api.post<ApiResponse<MediaUploadResponse>>("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
