import type { ApiResponse } from "@/types/api";
import type {
  SearchHistory,
  SearchLive,
  SearchSuggestion,
  SearchTopResult,
  SearchType,
  SearchUser,
  SearchVideo,
} from "@/types/search";
import api from "@/utils/axios-instance";

export interface SearchPageParams {
  q: string;
  page?: number;
  size?: number;
}

export const searchTop = async (q: string): Promise<ApiResponse<SearchTopResult>> => {
  const response = await api.get<ApiResponse<SearchTopResult>>("/search/top", { params: { q } });
  return response.data;
};

export const searchUsers = async (params: SearchPageParams): Promise<ApiResponse<SearchUser[]>> => {
  const response = await api.get<ApiResponse<SearchUser[]>>("/search/users", { params });
  return response.data;
};

export const searchVideos = async (params: SearchPageParams): Promise<ApiResponse<SearchVideo[]>> => {
  const response = await api.get<ApiResponse<SearchVideo[]>>("/search/videos", { params });
  return response.data;
};

export const searchLive = async (params: SearchPageParams): Promise<ApiResponse<SearchLive[]>> => {
  const response = await api.get<ApiResponse<SearchLive[]>>("/search/live", { params });
  return response.data;
};

export const getSearchSuggestions = async (q: string): Promise<ApiResponse<SearchSuggestion>> => {
  const response = await api.get<ApiResponse<SearchSuggestion>>("/search/suggestions", { params: { q } });
  return response.data;
};

export const getSearchHistory = async (): Promise<ApiResponse<SearchHistory[]>> => {
  const response = await api.get<ApiResponse<SearchHistory[]>>("/search/history");
  return response.data;
};

export const saveSearchHistory = async (
  keyword: string,
  type: SearchType = "ALL",
): Promise<ApiResponse<SearchHistory>> => {
  const response = await api.post<ApiResponse<SearchHistory>>("/search/history", {
    keyword,
    type,
    sourceType: "KEYWORD",
  });
  return response.data;
};

export const deleteSearchHistory = async (historyId: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/search/history/${historyId}`);
  return response.data;
};

export const clearSearchHistory = async (): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>("/search/history");
  return response.data;
};
