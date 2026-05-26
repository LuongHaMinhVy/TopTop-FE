import { get } from "@/services/base-api-service";
import type { SoundItem } from "@/types/admin";

export const getAdminSounds = async (params?: {
  keyword?: string;
  page?: number;
  size?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.keyword) searchParams.set("keyword", params.keyword);
  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 6));

  return get<SoundItem[]>(`/admin/sounds?${searchParams.toString()}`);
};
