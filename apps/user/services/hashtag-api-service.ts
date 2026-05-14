import { AxiosError } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";

import type { HashtagSuggestion } from "@/types/hashtag";

export const getHashtagSuggestions = async (keyword?: string): Promise<ApiResponse<HashtagSuggestion[]>> => {
  try {
    const params = keyword ? { keyword } : {};
    const response = await api.get<ApiResponse<HashtagSuggestion[]>>("/hashtags/suggestions", { params });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
