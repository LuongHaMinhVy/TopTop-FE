import { useQuery } from "@tanstack/react-query";
import type { AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";
import { oauth2Exchange } from "@/services/auth-api-service";

export const useOAuth2Exchange = (state: string | null) => {
  return useQuery<ApiResponse<AuthResponse>>({
    queryKey: ["oauth2-exchange", state],
    queryFn: () => {
      if (!state) throw new Error("Missing state");
      return oauth2Exchange(state);
    },
    enabled: !!state,
    retry: false,
    staleTime: 0,
  });
};