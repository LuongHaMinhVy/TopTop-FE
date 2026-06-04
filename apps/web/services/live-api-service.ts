import api from "@/utils/axios-instance";
import type { ApiResponse } from "@/types/api";
import type {
  LivestreamResponse,
  JoinLivestreamResponse,
  LiveChatMessageResponse,
  GiftCatalogResponse,
  CreateLivestreamRequest,
  SendChatMessageRequest,
  SendGiftRequest,
  LivestreamReadinessResponse,
} from "@/types/live";


export const getFeed = async (page = 0, size = 20) => {
  const res = await api.get<ApiResponse<LivestreamResponse[]>>(`/lives/feed`, {
    params: { page, size },
  });
  return res.data;
};

export const getLivestream = async (id: number) => {
  const res = await api.get<ApiResponse<LivestreamResponse>>(`/lives/${id}`);
  return res.data;
};

export const getMyLivestreams = async () => {
  const res = await api.get<ApiResponse<LivestreamResponse[]>>("/lives/me");
  return res.data;
};

export const createLivestream = async (data: CreateLivestreamRequest) => {
  const res = await api.post<ApiResponse<LivestreamResponse>>("/lives", data);
  return res.data;
};

export const startLivestream = async (id: number) => {
  const res = await api.post<ApiResponse<JoinLivestreamResponse>>(`/lives/${id}/start`);
  return res.data;
};

export const joinLivestream = async (id: number) => {
  const res = await api.post<ApiResponse<JoinLivestreamResponse>>(`/lives/${id}/join`);
  return res.data;
};

export const endLivestream = async (id: number) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/end`);
  return res.data;
};

export const leaveStream = async (id: number) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/leave`);
  return res.data;
};

export const getChatHistory = async (id: number, page = 0, size = 50) => {
  const res = await api.get<ApiResponse<LiveChatMessageResponse[]>>(`/lives/${id}/chat/messages`, {
    params: { page, size },
  });
  return res.data;
};

export const sendChatMessage = async (id: number, data: SendChatMessageRequest) => {
  const res = await api.post<ApiResponse<LiveChatMessageResponse>>(`/lives/${id}/chat/messages`, data);
  return res.data;
};

export const sendReaction = async (id: number, type: string = "LIKE") => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/reactions`, { type });
  return res.data;
};

export const getGiftCatalog = async () => {
  const res = await api.get<ApiResponse<GiftCatalogResponse[]>>(`/lives/gifts/catalog`);
  return res.data;
};

export const sendGift = async (id: number, data: SendGiftRequest) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/gifts`, data);
  return res.data;
};

export const followHost = async (username: string) => {
  const res = await api.post<ApiResponse<void>>(`/follow/${username}`);
  return res.data;
};

export const unfollowHost = async (username: string) => {
  const res = await api.delete<ApiResponse<void>>(`/follow/${username}`);
  return res.data;
};

export const hideMessage = async (id: number, messageId: number) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/moderation/messages/${messageId}/hide`);
  return res.data;
};

export const pinMessage = async (id: number, messageId: number) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/moderation/messages/${messageId}/pin`);
  return res.data;
};

export const banUser = async (id: number, userId: number, reason?: string) => {
  const res = await api.post<ApiResponse<void>>(`/lives/${id}/moderation/users/${userId}/ban`, { reason });
  return res.data;
};

// ── Stream readiness polling ─────────────────────────────────────────────────

/** Lightweight status check — does NOT join the room, just returns the current DB status. */
export const getStreamStatus = async (id: number): Promise<LivestreamReadinessResponse> => {
  const res = await api.get<ApiResponse<LivestreamReadinessResponse>>(`/lives/${id}/status`);
  if (!res.data.data) throw new Error("No status data returned");
  return res.data.data;
};

export interface PollOptions {
  /** How long to wait in ms before giving up. Default 60 000 ms. */
  maxWaitMs?: number;
  /** Starting poll interval in ms. Default 1 500. */
  initialIntervalMs?: number;
  /** Maximum poll interval cap in ms. Default 5 000. */
  maxIntervalMs?: number;
  /** Optional signal to abort early. */
  signal?: AbortSignal;
  /** Called on each poll attempt with the current attempt index. */
  onAttempt?: (attempt: number) => void;
}

/**
 * Polls `GET /lives/{id}/status` with exponential back-off until the status is
 * `"LIVE"` or the max wait time is exceeded / signal is aborted.
 *
 * Resolves with the readiness response when ready.
 * Rejects with an error when timeout or aborted.
 */
export const pollUntilStreamReady = (id: number, options: PollOptions = {}): Promise<LivestreamReadinessResponse> => {
  const {
    maxWaitMs = 60_000,
    initialIntervalMs = 1_500,
    maxIntervalMs = 5_000,
    signal,
    onAttempt,
  } = options;

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxWaitMs;
    let attempt = 0;
    let intervalMs = initialIntervalMs;
    let timer: ReturnType<typeof setTimeout>;

    const abort = () => {
      clearTimeout(timer);
      reject(new Error("ABORTED"));
    };

    signal?.addEventListener("abort", abort, { once: true });

    const poll = async () => {
      if (signal?.aborted) return;

      onAttempt?.(attempt++);

      try {
        const result = await getStreamStatus(id);
        console.log(`[pollUntilStreamReady] Attempt ${attempt}: status =`, result.status);
        if (result.status === "LIVE") {
          signal?.removeEventListener("abort", abort);
          resolve(result);
          return;
        }
        if (result.status === "ENDED" || result.status === "CANCELLED") {
          signal?.removeEventListener("abort", abort);
          reject(new Error(`Stream is ${result.status}`));
          return;
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("[pollUntilStreamReady] Error polling stream status:", err);
        // If it's a security/401/403/404 error, reject immediately rather than infinite loop
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          signal?.removeEventListener("abort", abort);
          reject(new Error(`Polling failed with HTTP ${status}: ${err?.response?.data?.message || err.message}`));
          return;
        }
      }

      if (Date.now() >= deadline) {
        signal?.removeEventListener("abort", abort);
        reject(new Error("TIMEOUT"));
        return;
      }

      // Exponential back-off capped at maxIntervalMs
      intervalMs = Math.min(intervalMs * 1.4, maxIntervalMs);
      timer = setTimeout(poll, intervalMs);
    };

    void poll();
  });
};

