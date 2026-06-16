import { AxiosError, AxiosProgressEvent } from "axios";
import api from "@/utils/axios-instance";
import { handleErrorResponse } from "./handle-error-response";
import type { ApiResponse } from "@/types/api";
import type { Video, VideoDescriptionTranslation } from "@/types/video";
import type { VideoStatsResponse } from "@/types/video-like";

export interface VideoDailyMetric {
  date: string;
  views: number;
}

export const getAllVideos = async (page = 0, size = 2): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/videos", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserVideos = async (userId: number, page = 0, size = 100): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/videos/user/${userId}`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const deleteVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const uploadVideo = async (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.post<ApiResponse<Video>>("/videos/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const reportVideo = async (videoId: number, reason: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/report`, { reason });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const markVideoNotInterested = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/not-interested`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const translateVideoDescription = async (
  videoId: number,
  targetLocale: string
): Promise<ApiResponse<VideoDescriptionTranslation>> => {
  try {
    const response = await api.get<ApiResponse<VideoDescriptionTranslation>>(
      `/videos/${videoId}/description-translation`,
      { params: { targetLocale } }
    );
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const recordVideoView = async (videoId: number, watchDurationMs?: number): Promise<ApiResponse<VideoStatsResponse>> => {
  try {
    const response = await api.post<ApiResponse<VideoStatsResponse>>(`/videos/${videoId}/view`, null, {
      params: watchDurationMs !== undefined ? { watchDurationMs } : undefined
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getStudioDailyViews = async (days = 7): Promise<ApiResponse<VideoDailyMetric[]>> => {
  try {
    const response = await api.get<ApiResponse<VideoDailyMetric[]>>("/videos/studio/analytics/views", {
      params: { days }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const likeVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const unlikeVideo = async (videoId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/videos/${videoId}/like`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getVideoByUsernameAndId = async (username: string, videoId: number): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.get<ApiResponse<Video>>(`/videos/@${username}/${videoId}`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface VideoCategory {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export const getVideoCategories = async (): Promise<ApiResponse<VideoCategory[]>> => {
  try {
    const response = await api.get<ApiResponse<VideoCategory[]>>("/videos/categories");
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface UpdateVideoPayload {
  title: string;
  description?: string;
  category?: string;
  videoCategoryId?: number;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  allowComments?: boolean;
  allowEdit?: boolean;
  soundId?: number | null;
  editInstructions?: VideoEditInstructionsPayload | null;
}

export const updateVideo = async (videoId: number, payload: UpdateVideoPayload): Promise<ApiResponse<Video>> => {
  try {
    const response = await api.put<ApiResponse<Video>>(`/videos/${videoId}`, payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getLikedVideos = async (page = 0, size = 18): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>("/videos/liked", {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserLikedVideos = async (username: string, page = 0, size = 18): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/videos/users/${username}/liked`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getUserRepostedVideos = async (username: string, page = 0, size = 18): Promise<ApiResponse<Video[]>> => {
  try {
    const response = await api.get<ApiResponse<Video[]>>(`/videos/users/${username}/reposts`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export interface InitVideoUploadPayload {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface InitVideoUploadResponse {
  uploadId: string;
  uploadUrl: string;
  objectKey: string;
  method: string;
}

export interface VideoEditInstructionsPayload {
  videoTrim?: {
    startSeconds: number;
    endSeconds: number;
  };
  selectedSoundId?: number | null;
  soundTrim?: {
    startSeconds: number;
    endSeconds: number | null;
  } | null;
  audioMix?: {
    originalAudioVolume: number;
    soundVolume: number;
    soundStartAtVideoSeconds: number;
  };
  coverFrameSeconds?: number | null;
}

export interface CompleteVideoUploadPayload {
  uploadId: string;
  title: string;
  description?: string;
  category?: string;
  videoCategoryId?: number;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  allowComments?: boolean;
  allowEdit?: boolean;
  soundId?: number | null;
  useAvatarAsSoundCover?: boolean;
  enableMusicCopyrightCheck?: boolean;
  enableContentModerationCheck?: boolean;
  editInstructions?: VideoEditInstructionsPayload | null;
}

export const initVideoUpload = async (payload: InitVideoUploadPayload): Promise<ApiResponse<InitVideoUploadResponse>> => {
  try {
    const response = await api.post<ApiResponse<InitVideoUploadResponse>>("/videos/init", payload);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const completeVideoUpload = async (
  payload: CompleteVideoUploadPayload,
  coverFile?: File
): Promise<ApiResponse<Video>> => {
  try {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
    if (coverFile) {
      formData.append("cover", coverFile);
    }
    const response = await api.post<ApiResponse<Video>>("/videos/complete", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};

export const getVideoModerationStatus = async (videoId: number): Promise<ApiResponse<{
  videoId: number;
  moderationStatus: string;
  riskScore: number | null;
  reasonCode: string | null;
  reasonMessage: string | null;
  checkedAt: string | null;
  musicCopyrightStatus: string | null;
  musicCopyrightReasonCode: string | null;
  musicCopyrightReasonMessage: string | null;
  musicCopyrightCheckedAt: string | null;
  qualityIssues: string[] | null;
  qualityIssueMessage: string | null;
}>> => {
  try {
    const response = await api.get<ApiResponse<{
      videoId: number;
      moderationStatus: string;
      riskScore: number | null;
      reasonCode: string | null;
      reasonMessage: string | null;
      checkedAt: string | null;
      musicCopyrightStatus: string | null;
      musicCopyrightReasonCode: string | null;
      musicCopyrightReasonMessage: string | null;
      musicCopyrightCheckedAt: string | null;
      qualityIssues: string[] | null;
      qualityIssueMessage: string | null;
    }>>(`/videos/${videoId}/moderation-status`);
    return response.data;
  } catch (error) {
    handleErrorResponse(error as AxiosError);
    throw error;
  }
};
