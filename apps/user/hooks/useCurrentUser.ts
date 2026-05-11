"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/user-api-service";
import { setCredentials, clearCredentials } from "@/store/slices/authSlice";
import { useEffect } from "react";
import type { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";

export function useCurrentUser() {
  const dispatch = useDispatch<AppDispatch>();

  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.data) {
      dispatch(
        setCredentials({
          user: query.data.data,
        })
      );
    } else if (query.isError) {
      dispatch(clearCredentials());
    }
  }, [query.isSuccess, query.isError, query.data, dispatch]);

  return query;
}
