import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import * as followingService from "@/services/following-api-service";

export const useFollowingFeed = (enabled = true, pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: ["following-feed", pageSize],
    queryFn: ({ pageParam = 0 }) => followingService.getFollowingFeed(pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      const nextPage = meta.page + 1;
      return nextPage < meta.totalPages ? nextPage : undefined;
    },
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useFollowingSuggestions = (pageSize = 12) => {
  return useQuery({
    queryKey: ["following-suggestions", pageSize],
    queryFn: () => followingService.getFollowingSuggestions(0, pageSize),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useFollowingTray = (enabled = true) => {
  return useQuery({
    queryKey: ["following-tray"],
    queryFn: () => followingService.getFollowingTray(),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
