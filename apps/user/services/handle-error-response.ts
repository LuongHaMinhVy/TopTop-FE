import { AxiosError } from "axios";
import type { ApiResponse } from "@/utils/interfaces";

export const handleErrorResponse = (error: AxiosError): never => {
  const data = error.response?.data as ApiResponse | undefined;
  const message =
    data?.message ||
    data?.errors?.[0]?.message ||
    error.message ||
    "An unexpected error occurred";

  throw new Error(message);
};