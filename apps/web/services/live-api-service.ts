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
