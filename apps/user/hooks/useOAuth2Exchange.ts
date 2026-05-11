import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios-instance";
import type { AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export const useOAuth2Exchange = (state: string | null) => {
  return useQuery<ApiResponse<AuthResponse>>({
    queryKey: ["oauth2-exchange", state],
    queryFn: async () => {
      if (!state) throw new Error("Missing state");
      const res = await api.get<ApiResponse<AuthResponse>>(`/auth/oauth2/exchange?state=${state}&X-App-Id=toptopuser`);
      return res.data;
    },
    enabled: !!state,
    retry: false,
    staleTime: 0, // Ensure we always exchange fresh
  });
};