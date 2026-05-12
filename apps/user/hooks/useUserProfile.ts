"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/user-api-service";

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
    retry: false,
    staleTime: 5 * 60 * 1000
  });
}
