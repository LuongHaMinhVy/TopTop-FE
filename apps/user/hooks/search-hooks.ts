import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as searchService from "@/services/search-api-service";
import type { SearchType } from "@/types/search";

export const useSearchTop = (q: string) =>
  useQuery({
    queryKey: ["search", "top", q],
    queryFn: () => searchService.searchTop(q),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  });

export const useSearchUsers = (q: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: ["search", "users", q, page, size],
    queryFn: () => searchService.searchUsers({ q, page, size }),
    enabled: enabled && q.trim().length > 0,
    staleTime: 30_000,
  });

export const useSearchVideos = (q: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: ["search", "videos", q, page, size],
    queryFn: () => searchService.searchVideos({ q, page, size }),
    enabled: enabled && q.trim().length > 0,
    staleTime: 30_000,
  });

export const useSearchLive = (q: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: ["search", "live", q, page, size],
    queryFn: () => searchService.searchLive({ q, page, size }),
    enabled: enabled && q.trim().length > 0,
    staleTime: 30_000,
  });

export const useSearchSuggestions = (q: string, enabled: boolean) =>
  useQuery({
    queryKey: ["search", "suggestions", q],
    queryFn: () => searchService.getSearchSuggestions(q),
    enabled: enabled && q.trim().length > 0,
    staleTime: 30_000,
  });

export const useSearchHistory = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["search", "history"],
    queryFn: searchService.getSearchHistory,
    enabled,
    staleTime: 30_000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: searchService.deleteSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
  });

  const clearMutation = useMutation({
    mutationFn: searchService.clearSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
  });

  return { historyQuery, deleteMutation, clearMutation };
};

export const useSaveSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ keyword, type = "ALL" }: { keyword: string; type?: SearchType }) =>
      searchService.saveSearchHistory(keyword, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
  });
};
