import { get, post } from "@/services/base-api-service";
import type {
  AdminLivestream,
  AdminLivestreamStatus,
  PageResponse,
} from "@/types/admin";

export const getAdminLivestreams = async (params?: {
  keyword?: string;
  status?: AdminLivestreamStatus | "";
  page?: number;
  size?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.keyword) sp.set("keyword", params.keyword);
  if (params?.status) sp.set("status", params.status);
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<PageResponse<AdminLivestream>>(`/admin/livestreams?${sp.toString()}`);
};

export const endAdminLivestream = async (livestreamId: number) => {
  return post<AdminLivestream>(`/admin/livestreams/${livestreamId}/end`);
};
