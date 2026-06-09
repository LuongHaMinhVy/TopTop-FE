import { del, get, patch, post } from "@/services/base-api-service";
import type { CreateSoundRequest, SoundItem, UpdateSoundRequest } from "@/types/admin";

export const getAdminSounds = async (params?: {
  keyword?: string;
  page?: number;
  size?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.keyword) searchParams.set("keyword", params.keyword);
  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 18));

  return get<SoundItem[]>(`/admin/sounds?${searchParams.toString()}`);
};

export const createAdminSound = async (data: CreateSoundRequest) => {
  return post<SoundItem>("/admin/sounds", data);
};

export const updateAdminSound = async (
  soundId: number,
  data: UpdateSoundRequest
) => {
  return patch<SoundItem>(`/admin/sounds/${soundId}`, data);
};

export const deleteAdminSound = async (soundId: number) => {
  return del<void>(`/admin/sounds/${soundId}`);
};
