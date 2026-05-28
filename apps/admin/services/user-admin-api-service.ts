import { get, patch } from "@/services/base-api-service";
import type {
  AdminUser,
  AdminUpdateUserStatusRequest,
  PageResponse,
} from "@/types/admin";

export const getAdminUsers = async (params?: {
  keyword?: string;
  status?: AdminUser["status"] | "";
  page?: number;
  size?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.keyword) sp.set("keyword", params.keyword);
  if (params?.status) sp.set("status", params.status);
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<PageResponse<AdminUser>>(`/admin/users?${sp.toString()}`);
};

export const updateAdminUserStatus = async (
  userId: number,
  request: AdminUpdateUserStatusRequest,
) => {
  return patch<AdminUser>(`/admin/users/${userId}/status`, request);
};
