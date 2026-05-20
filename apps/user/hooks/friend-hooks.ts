import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import * as friendService from "@/services/friend-api-service";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export const useFriendsFeed = (enabled = true, pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: ["friends-feed", pageSize],
    queryFn: ({ pageParam = 0 }) => friendService.getFriendsFeed(pageParam, pageSize),
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

export const useFriendsSuggestions = (pageSize = 12, enabled = true) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  return useQuery({
    queryKey: ["friends-suggestions", currentUserId ?? "anonymous", pageSize],
    queryFn: () => friendService.getFriendsSuggestions(0, pageSize),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useFriendsCount = (enabled = true) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  return useQuery({
    queryKey: ["friends-count", currentUserId ?? "anonymous"],
    queryFn: () => friendService.getFriendsCount(),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
