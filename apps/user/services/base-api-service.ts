import { ApiResponse } from "@/types/api";
import api from "@/utils/axios-instance";

export const get = async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await api.get<ApiResponse<T>>(url);
    return response.data;
};

export const post = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data;
};

export const put = async <T>(url: string, data: unknown): Promise<ApiResponse<T>> => {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data;
};

export const patch = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await api.patch<ApiResponse<T>>(url, data);
    return response.data;
};

export const del = async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data;
};