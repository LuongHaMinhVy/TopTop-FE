import { ApiResponse } from "@/types/api";
import { AxiosError } from "axios";

export const handleErrorResponse = (error: AxiosError): never => {
  const data = error.response?.data as ApiResponse | undefined;
  const message =
    data?.message ||
    data?.errors?.[0]?.message ||
    error.message ||
    "An unexpected error occurred";

  throw new Error(message);
};