import { useQuery } from "@tanstack/react-query";
import * as hashtagService from "@/services/hashtag-api-service";
import * as userService from "@/services/user-api-service";

export const useHashtagSuggestions = (keyword: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["hashtag-suggestions", keyword],
    queryFn: () => hashtagService.getHashtagSuggestions(keyword),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
};

export const useMentionSuggestions = (keyword: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["mention-suggestions", keyword],
    queryFn: () => userService.getMentionSuggestions(keyword),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
};
