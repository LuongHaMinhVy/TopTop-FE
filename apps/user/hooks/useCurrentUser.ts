"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/user-api-service";
import { setCredentials, clearCredentials } from "@/store/slices/authSlice";
import { useEffect } from "react";
import type { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";

export function useCurrentUser(enabled: boolean = true) {
  const dispatch = useDispatch<AppDispatch>();

  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
    enabled
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.data) {
      dispatch(
        setCredentials({
          user: query.data.data,
        })
      );
    } else if (query.isError && !query.isFetching) {
      // Only clear if we're certain it's a hard error and not a background refetch
      dispatch(clearCredentials());
    }
  }, [query.isSuccess, query.isError, query.isFetching, query.data, dispatch]);

  return query;
}
