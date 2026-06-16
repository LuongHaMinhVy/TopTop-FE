import { get, post } from "@/services/base-api-service";
import type {
  ModerationQueueItem,
  PageResponse,
  VideoModerationDetail,
  ReviewVideoModerationRequest,
  VideoModerationSummary,
  ModerationAuditLog,
} from "@/types/admin";

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

export const getVideoModerationDetail = async (videoId: number) => {
  return get<VideoModerationDetail>(`/admin/moderation/videos/${videoId}`);
};

export const reviewVideoModeration = async (
  videoId: number,
  request: ReviewVideoModerationRequest,
) => {
  return post<VideoModerationSummary>(
    `/admin/moderation/videos/${videoId}/review`,
    request,
  );
};

export const getModerationAuditLogs = async (params?: { page?: number; size?: number }) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 10));

  return get<PageResponse<ModerationAuditLog>>(
    `/admin/moderation/videos/audit-logs?${searchParams.toString()}`,
  );
};
