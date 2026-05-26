import { get } from "@/services/base-api-service";
import type { ModerationQueueItem, PageResponse } from "@/types/admin";

export const getVideoModerationQueue = async (params?: {
  status?: string;
  page?: number;
  size?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set("status", params.status);
  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 10));

  return get<PageResponse<ModerationQueueItem>>(
    `/admin/moderation/videos?${searchParams.toString()}`,
  );
};
