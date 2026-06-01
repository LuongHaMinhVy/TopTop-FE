'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import axios from 'axios';
import { useUploadVideoMutation, useInitVideoUploadMutation, useCompleteVideoUploadMutation } from '@/hooks/video-hooks';
import { RefreshCw, Hash, AtSign, CheckCircle2, AlertCircle, ChevronDown, X, Upload, Film, ImagePlus, Music, Scissors, Type, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useHashtagSuggestions, useMentionSuggestions } from '@/hooks/suggestion-hooks';
import { useConversations } from '@/hooks/chat-hooks';
import { useFollowingList } from '@/hooks/user-hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import type { HashtagSuggestion } from '@/types/hashtag';
import type { MentionSuggestion } from '@/types/mention';
import UploadDropzone from '@/components/upload/UploadDropzone';
import VideoPreviewPhone from '@/components/upload/VideoPreviewPhone';
import { useRouter, useSearchParams } from 'next/navigation';
import { SoundEditorPanel } from '@/components/sound/SoundEditorPanel';
import { useSoundDetail } from '@/hooks/sound-hooks';
import type { Sound } from '@/types/sound';

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'uploaded' | 'success' | 'error';
type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_REVIEW';
type MusicCopyrightStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_REVIEW';

const TEXT_MODERATION_ERROR_MESSAGE =
  'Tiêu đề hoặc mô tả video có nội dung không phù hợp. Vui lòng chỉnh lại từ ngữ nhạy cảm, nội dung vi phạm hoặc hashtag không phù hợp rồi đăng lại.';

const toFriendlyUploadErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (
    normalized.includes('video title or description rejected by moderation') ||
    normalized.includes('mô tả hoặc tiêu đề video bị từ chối') ||
    normalized.includes('tiêu đề hoặc mô tả video')
  ) {
    return TEXT_MODERATION_ERROR_MESSAGE;
  }
  return message;
};
type CoverSourceTab = 'video' | 'upload';

interface VideoFrameOption {
  dataUrl: string;
  timestamp: number;
}

interface UploadMetadata {
  title: string;
  description: string;
  category?: string;
  visibility: string;
  allowComments: boolean;
  allowEdit: boolean;
  soundId?: number | null;
  useAvatarAsSoundCover?: boolean;
}

const COVER_OUTPUT_WIDTH = 1080;
const COVER_OUTPUT_HEIGHT = 1920;

const getClampedImagePosition = ({
  current,
  frameEnd,
  frameStart,
  imageSize,
}: {
  current: number;
  frameEnd: number;
  frameStart: number;
  imageSize: number;
}) => {
  const min = frameEnd - imageSize;
  const max = frameStart;

  if (imageSize <= frameEnd - frameStart) {
    return frameStart + (frameEnd - frameStart - imageSize) / 2;
  }

  return Math.min(max, Math.max(min, current));
};

export default function UploadVideo() {
  const t = useTranslations('Studio.upload');
  const user = useSelector((state: RootState) => state.auth.user);
  const defaultAllowComments = user?.privacySettings?.allowComments ?? true;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSoundId = Number(searchParams.get('soundId'));

  // Navigation Guard State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState<number | null>(null);
  const [moderationResult, setModerationResult] = useState<{
    moderationStatus: ModerationStatus;
    reasonCode: string | null;
    reasonMessage: string | null;
    riskScore: number | null;
    musicCopyrightStatus: MusicCopyrightStatus | null;
    musicCopyrightReasonCode: string | null;
    musicCopyrightReasonMessage: string | null;
    qualityIssues?: string[] | null;
    qualityIssueMessage?: string | null;
  } | null>(null);

  // Quality check states
  const [musicCopyrightCheckEnabled, setMusicCopyrightCheckEnabled] = useState(true);
  const [fastContentCheckEnabled, setFastContentCheckEnabled] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverManuallySelected, setCoverManuallySelected] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverTab, setCoverTab] = useState<CoverSourceTab>('video');
  const [videoFrames, setVideoFrames] = useState<VideoFrameOption[]>([]);
  const [selectedCoverTime, setSelectedCoverTime] = useState(0);
  const [selectedVideoFramePreview, setSelectedVideoFramePreview] = useState<string | null>(null);
  const [importedCoverSource, setImportedCoverSource] = useState<string | null>(null);
  const [importedCoverName, setImportedCoverName] = useState('cover.jpg');
  const [coverCropZoom, setCoverCropZoom] = useState(1);
  const [coverImageX, setCoverImageX] = useState(0);
  const [coverImageY, setCoverImageY] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [framesLoading, setFramesLoading] = useState(false);
  const coverVideoRef = useRef<HTMLVideoElement>(null);
  const coverWorkspaceRef = useRef<HTMLDivElement>(null);
  const coverCropFrameRef = useRef<HTMLDivElement>(null);
  const coverImageRef = useRef<HTMLImageElement>(null);
  const coverDragRef = useRef<{
    frameBottom: number;
    frameLeft: number;
    frameRight: number;
    frameTop: number;
    imageHeight: number;
    imageWidth: number;
    startImageX: number;
    startImageY: number;
    startPointerX: number;
    startPointerY: number;
  } | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);

  // Settings
  const [visibility, setVisibility] = useState('PUBLIC');
  const [visibilityDropdownOpen, setVisibilityDropdownOpen] = useState(false);
  const [allowComments, setAllowComments] = useState(defaultAllowComments);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [previewMode, setPreviewMode] = useState<'FEED' | 'PROFILE' | 'WEB'>('FEED');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [soundEditorOpen, setSoundEditorOpen] = useState(false);
  const [soundEditorInitialTool, setSoundEditorInitialTool] = useState<'edit' | 'sound'>('edit');
  const [videoTrim, setVideoTrim] = useState({ startSeconds: 0, endSeconds: 0 });
  const [soundTrim, setSoundTrim] = useState({ startSeconds: 0, endSeconds: 0 });
  const [soundVolume, setSoundVolume] = useState(100);
  const [soundMuted, setSoundMuted] = useState(false);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(100);
  const [soundStartOffset, setSoundStartOffset] = useState(0);

  // Suggestion dropdowns
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const descRef = useRef<HTMLTextAreaElement>(null);
  const visibilityDropdownRef = useRef<HTMLDivElement>(null);

  const debouncedHashtagSearch = useDebounce(hashtagSearch, 300);
  const debouncedMentionSearch = useDebounce(mentionSearch, 300);
  const { data: hashtagRes, isLoading: loadingHashtags } = useHashtagSuggestions(debouncedHashtagSearch, showHashtagDropdown);
  const hasMentionSearch = debouncedMentionSearch.trim().length > 0;
  const { data: mentionRes, isLoading: loadingMentions } = useMentionSuggestions(
    debouncedMentionSearch,
    showMentionDropdown && hasMentionSearch,
  );
  const { data: conversationsRes } = useConversations(0, 20, 'ACTIVE');
  const { data: followingRes } = useFollowingList(Boolean(user));
  const hashtags = hashtagRes?.data || [];
  const mentionSearchResults = mentionRes?.data || [];
  const prioritizedMentionSuggestions = useMemo<MentionSuggestion[]>(() => {
    const seen = new Set<number>();
    const result: MentionSuggestion[] = [];

    const pushMention = (mention: MentionSuggestion | null) => {
      if (!mention || seen.has(mention.id)) return;
      seen.add(mention.id);
      result.push(mention);
    };

    (conversationsRes?.data ?? []).forEach((conversation) => {
      const target = conversation.targetUser;
      if (!target) return;
      pushMention({
        id: target.userId,
        username: target.username,
        displayName: target.displayName,
        avatarUrl: target.avatarUrl,
        verified: target.verified,
      });
    });

    const followingUsers = followingRes?.data ?? [];
    followingUsers
      .filter((followedUser) => followedUser.relationship?.isFriend)
      .forEach((followedUser) => pushMention({
        id: followedUser.id,
        username: followedUser.username,
        displayName: followedUser.nickname || followedUser.username,
        avatarUrl: followedUser.avatarUrl || '',
        verified: Boolean(followedUser.verified),
      }));

    followingUsers
      .filter((followedUser) => !followedUser.relationship?.isFriend)
      .forEach((followedUser) => pushMention({
        id: followedUser.id,
        username: followedUser.username,
        displayName: followedUser.nickname || followedUser.username,
        avatarUrl: followedUser.avatarUrl || '',
        verified: Boolean(followedUser.verified),
      }));

    return result.slice(0, 8);
  }, [conversationsRes?.data, followingRes?.data]);
  const mentions = hasMentionSearch ? mentionSearchResults : prioritizedMentionSuggestions;
  const visibilityOptions = useMemo(() => [
    { value: 'PUBLIC', label: t('everyone') },
    { value: 'FRIENDS', label: t('friends') },
    { value: 'PRIVATE', label: t('onlyMe') },
  ], [t]);
  const selectedVisibilityOption = visibilityOptions.find((option) => option.value === visibility) ?? visibilityOptions[0];

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const submitLockRef = useRef(false);
  const uploadMutation = useUploadVideoMutation();
  const initUploadMutation = useInitVideoUploadMutation();
  const completeUploadMutation = useCompleteVideoUploadMutation();
  const { data: initialSoundRes } = useSoundDetail(
    Number.isFinite(initialSoundId) && initialSoundId > 0 ? initialSoundId : undefined,
  );

  useEffect(() => {
    if (!initialSoundRes?.data) return;
    const frameId = requestAnimationFrame(() => setSelectedSound(initialSoundRes.data!));
    return () => cancelAnimationFrame(frameId);
  }, [initialSoundRes?.data]);

  useEffect(() => {
    if (!uploadedVideoId) return;

    const fetchModerationStatus = async () => {
      try {
        const { getVideoModerationStatus } = await import('@/services/video-api-service');
        const res = await getVideoModerationStatus(uploadedVideoId);
        if (res.data) {
          setModerationResult({
            moderationStatus: res.data.moderationStatus as ModerationStatus,
            reasonCode: res.data.reasonCode,
            reasonMessage: res.data.reasonMessage,
            riskScore: res.data.riskScore,
            musicCopyrightStatus: res.data.musicCopyrightStatus as MusicCopyrightStatus | null,
            musicCopyrightReasonCode: res.data.musicCopyrightReasonCode,
            musicCopyrightReasonMessage: res.data.musicCopyrightReasonMessage,
            qualityIssues: res.data.qualityIssues,
            qualityIssueMessage: res.data.qualityIssueMessage,
          });
          const contentDone = ['APPROVED', 'REJECTED', 'NEED_REVIEW'].includes(res.data.moderationStatus);
          const musicDone = res.data.musicCopyrightStatus
            ? ['APPROVED', 'REJECTED', 'NEED_REVIEW'].includes(res.data.musicCopyrightStatus)
            : false;
          if (contentDone && musicDone) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Failed to fetch video moderation status', error);
      }
    };

    const pollInterval = setInterval(fetchModerationStatus, 5000);
    void fetchModerationStatus();

    return () => clearInterval(pollInterval);
  }, [uploadedVideoId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  const formatTimestamp = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
  };

  const revokeCoverObjectUrl = useCallback(() => {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }
  }, []);

  const dataUrlToFile = (dataUrl: string, name: string) => {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], name, { type: mime });
  };

  const resetCoverCrop = useCallback(() => {
    setCoverCropZoom(1);
    setCoverImageX(0);
    setCoverImageY(0);
  }, []);

  const createCroppedCover = useCallback((imageSource: string, name: string) => {
    return new Promise<{ dataUrl: string; file: File }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = COVER_OUTPUT_WIDTH;
        canvas.height = COVER_OUTPUT_HEIGHT;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas is not available'));
          return;
        }

        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const workspaceRect = coverWorkspaceRef.current?.getBoundingClientRect();
        const frameRect = coverCropFrameRef.current?.getBoundingClientRect();

        if (workspaceRect && frameRect) {
          const workspaceScale = Math.max(1, COVER_OUTPUT_HEIGHT / frameRect.height);
          const workspaceWidth = Math.round(workspaceRect.width * workspaceScale);
          const workspaceHeight = Math.round(workspaceRect.height * workspaceScale);
          const frameX = Math.round((frameRect.left - workspaceRect.left) * workspaceScale);
          const frameY = Math.round((frameRect.top - workspaceRect.top) * workspaceScale);
          const frameWidth = Math.round(frameRect.width * workspaceScale);
          const frameHeight = Math.round(frameRect.height * workspaceScale);

          const workspaceCanvas = document.createElement('canvas');
          workspaceCanvas.width = workspaceWidth;
          workspaceCanvas.height = workspaceHeight;
          const workspaceContext = workspaceCanvas.getContext('2d');

          if (!workspaceContext) {
            reject(new Error('Canvas is not available'));
            return;
          }

          workspaceContext.fillStyle = '#000';
          workspaceContext.fillRect(0, 0, workspaceWidth, workspaceHeight);

          const baseHeight = workspaceHeight * coverCropZoom;
          const baseWidth = image.naturalWidth * (baseHeight / image.naturalHeight);

          workspaceContext.drawImage(
            image,
            coverImageX * workspaceScale,
            coverImageY * workspaceScale,
            baseWidth,
            baseHeight,
          );
          context.drawImage(
            workspaceCanvas,
            frameX,
            frameY,
            frameWidth,
            frameHeight,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        } else {
          const drawHeight = canvas.height * coverCropZoom;
          const drawWidth = image.naturalWidth * (drawHeight / image.naturalHeight);
          const drawX = (canvas.width - drawWidth) / 2;
          const drawY = (canvas.height - drawHeight) / 2;

          context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({
          dataUrl,
          file: dataUrlToFile(dataUrl, name),
        });
      };
      image.onerror = () => reject(new Error('Could not load cover image'));
      image.src = imageSource;
    });
  }, [coverCropZoom, coverImageX, coverImageY]);

  const applyCroppedCover = useCallback(async (imageSource: string | null, name: string) => {
    if (!imageSource) return;

    const croppedCover = await createCroppedCover(imageSource, name);
    revokeCoverObjectUrl();
    setCoverFile(croppedCover.file);
    setCoverPreview(croppedCover.dataUrl);
    setCoverManuallySelected(true);
    setCoverPickerOpen(false);
  }, [createCroppedCover, revokeCoverObjectUrl]);

  const captureVideoFrame = useCallback((video: HTMLVideoElement, timestamp: number) => {
    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement('canvas');
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');

    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      timestamp,
    };
  }, []);

  const setCurrentVideoFrameCover = useCallback(() => {
    if (!selectedVideoFramePreview) return;

    void applyCroppedCover(
      selectedVideoFramePreview,
      `cover-${Math.round(selectedCoverTime * 1000)}.jpg`,
    );
  }, [applyCroppedCover, selectedCoverTime, selectedVideoFramePreview]);

  const setImportedCoverForCrop = useCallback((selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setImportedCoverName(selectedFile.name || 'cover.jpg');
      setImportedCoverSource(reader.result);
      resetCoverCrop();
    };
    reader.readAsDataURL(selectedFile);
  }, [resetCoverCrop]);

  const setCurrentImportedCover = useCallback(() => {
    void applyCroppedCover(importedCoverSource, importedCoverName);
  }, [applyCroppedCover, importedCoverName, importedCoverSource]);

  const seekCoverPreview = useCallback((timestamp: number) => {
    const nextTime = Math.min(Math.max(timestamp, 0), Math.max(videoDuration, timestamp));
    setSelectedCoverTime(nextTime);

    const video = coverVideoRef.current;
    if (video) {
      video.currentTime = nextTime;
    }
  }, [videoDuration]);

  const getCoverCropMetrics = useCallback((zoom: number) => {
    const workspace = coverWorkspaceRef.current;
    const frame = coverCropFrameRef.current;
    const image = coverImageRef.current;
    if (!workspace || !frame || !image || !image.naturalWidth || !image.naturalHeight) return null;

    const workspaceRect = workspace.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const imageHeight = workspaceRect.height * zoom;
    const imageWidth = image.naturalWidth * (imageHeight / image.naturalHeight);
    const frameLeft = frameRect.left - workspaceRect.left;
    const frameTop = frameRect.top - workspaceRect.top;
    const frameRight = frameRect.right - workspaceRect.left;
    const frameBottom = frameRect.bottom - workspaceRect.top;

    return {
      frameBottom,
      frameLeft,
      frameRight,
      frameTop,
      imageHeight,
      imageWidth,
    };
  }, []);

  const centerCoverImage = useCallback((zoom = coverCropZoom) => {
    const metrics = getCoverCropMetrics(zoom);
    if (!metrics) return;

    setCoverImageX(getClampedImagePosition({
      current: metrics.frameLeft + (metrics.frameRight - metrics.frameLeft - metrics.imageWidth) / 2,
      frameEnd: metrics.frameRight,
      frameStart: metrics.frameLeft,
      imageSize: metrics.imageWidth,
    }));
    setCoverImageY(getClampedImagePosition({
      current: metrics.frameTop + (metrics.frameBottom - metrics.frameTop - metrics.imageHeight) / 2,
      frameEnd: metrics.frameBottom,
      frameStart: metrics.frameTop,
      imageSize: metrics.imageHeight,
    }));
  }, [coverCropZoom, getCoverCropMetrics]);

  const handleCoverZoomChange = useCallback((nextZoom: number) => {
    const currentMetrics = getCoverCropMetrics(coverCropZoom);
    const nextMetrics = getCoverCropMetrics(nextZoom);

    setCoverCropZoom(nextZoom);
    if (!currentMetrics || !nextMetrics) return;

    const frameCenterX = (currentMetrics.frameLeft + currentMetrics.frameRight) / 2;
    const frameCenterY = (currentMetrics.frameTop + currentMetrics.frameBottom) / 2;
    const focalX = (frameCenterX - coverImageX) / currentMetrics.imageWidth;
    const focalY = (frameCenterY - coverImageY) / currentMetrics.imageHeight;
    const nextImageX = frameCenterX - focalX * nextMetrics.imageWidth;
    const nextImageY = frameCenterY - focalY * nextMetrics.imageHeight;

    setCoverImageX(getClampedImagePosition({
      current: nextImageX,
      frameEnd: nextMetrics.frameRight,
      frameStart: nextMetrics.frameLeft,
      imageSize: nextMetrics.imageWidth,
    }));
    setCoverImageY(getClampedImagePosition({
      current: nextZoom > 1 ? nextImageY : (nextMetrics.frameTop + nextMetrics.frameBottom - nextMetrics.imageHeight) / 2,
      frameEnd: nextMetrics.frameBottom,
      frameStart: nextMetrics.frameTop,
      imageSize: nextMetrics.imageHeight,
    }));
  }, [coverCropZoom, coverImageX, coverImageY, getCoverCropMetrics]);

  const beginCoverDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const metrics = getCoverCropMetrics(coverCropZoom);
    if (!metrics) return;

    coverDragRef.current = {
      ...metrics,
      startImageX: coverImageX,
      startImageY: coverImageY,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [coverCropZoom, coverImageX, coverImageY, getCoverCropMetrics]);

  const updateCoverDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = coverDragRef.current;
    if (!drag) return;

    const nextImageX = drag.startImageX + event.clientX - drag.startPointerX;
    setCoverImageX(getClampedImagePosition({
      current: nextImageX,
      frameEnd: drag.frameRight,
      frameStart: drag.frameLeft,
      imageSize: drag.imageWidth,
    }));

    if (coverCropZoom > 1) {
      const nextImageY = drag.startImageY + event.clientY - drag.startPointerY;
      setCoverImageY(getClampedImagePosition({
        current: nextImageY,
        frameEnd: drag.frameBottom,
        frameStart: drag.frameTop,
        imageSize: drag.imageHeight,
      }));
    }
  }, [coverCropZoom]);

  const endCoverDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    coverDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const clearCover = useCallback(() => {
    revokeCoverObjectUrl();
    setCoverFile(null);
    setCoverPreview(null);
    setCoverManuallySelected(false);
  }, [revokeCoverObjectUrl]);

  const extractVideoFrames = useCallback(async () => {
    if (!preview || framesLoading || videoFrames.length > 0) return;

    setFramesLoading(true);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Could not load video metadata'));
        video.src = preview;
        video.load();
      });

      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      const sampleCount = 8;
      const times = Array.from({ length: sampleCount }, (_, index) => {
        const offset = (index + 1) / (sampleCount + 1);
        return Math.min(Math.max(duration * offset, 0.1), Math.max(duration - 0.1, 0));
      });

      const canvas = document.createElement('canvas');
      const sourceWidth = video.videoWidth || 720;
      const sourceHeight = video.videoHeight || 1280;
      const maxSide = 900;
      const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas is not available');

      const frames: VideoFrameOption[] = [];

      for (const timestamp of times) {
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error('Could not seek video'));
          video.currentTime = timestamp;
        });

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({
          dataUrl: canvas.toDataURL('image/jpeg', 0.88),
          timestamp,
        });
      }

      setVideoFrames(frames);
      if (!selectedVideoFramePreview && frames[0]) {
        setSelectedCoverTime(frames[0].timestamp);
        setSelectedVideoFramePreview(frames[0].dataUrl);
      }
    } catch (error) {
      console.error(error);
      setVideoFrames([]);
    } finally {
      setFramesLoading(false);
    }
  }, [framesLoading, preview, selectedVideoFramePreview, videoFrames.length]);

  useEffect(() => {
    return () => revokeCoverObjectUrl();
  }, [revokeCoverObjectUrl]);

  useEffect(() => {
    if (!visibilityDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!visibilityDropdownRef.current?.contains(event.target as Node)) {
        setVisibilityDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [visibilityDropdownOpen]);

  // Extract the first frame as the default cover if none is chosen
  useEffect(() => {
    if (!preview) return;

    const extractDefaultCover = async () => {
      try {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Could not load video metadata'));
          video.src = preview;
          video.load();
        });

        // Seek to 0.05s to get a valid starting frame
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error('Could not seek video'));
          video.currentTime = 0.05;
        });

        const canvas = document.createElement('canvas');
        canvas.width = COVER_OUTPUT_WIDTH;
        canvas.height = COVER_OUTPUT_HEIGHT;
        const context = canvas.getContext('2d');
        if (context) {
          const sourceWidth = video.videoWidth || 720;
          const sourceHeight = video.videoHeight || 1280;

          // Crop source to 9:16 aspect ratio
          const targetAspect = 9 / 16;
          const sourceAspect = sourceWidth / sourceHeight;
          let drawWidth = sourceWidth;
          let drawHeight = sourceHeight;
          let sx = 0;
          let sy = 0;

          if (sourceAspect > targetAspect) {
            drawWidth = sourceHeight * targetAspect;
            sx = (sourceWidth - drawWidth) / 2;
          } else {
            drawHeight = sourceWidth / targetAspect;
            sy = (sourceHeight - drawHeight) / 2;
          }

          context.drawImage(
            video,
            sx, sy, drawWidth, drawHeight,
            0, 0, canvas.width, canvas.height
          );

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const defaultCoverFile = dataUrlToFile(dataUrl, 'default-cover.jpg');
          setCoverFile(defaultCoverFile);
          setCoverPreview(dataUrl);
          setCoverManuallySelected(false);
        }
      } catch (err) {
        console.warn('Failed to extract default cover frame:', err);
      }
    };

    void extractDefaultCover();
  }, [preview]);

  const openCoverPicker = useCallback(() => {
    setCoverPickerOpen(true);
    setCoverTab('video');
    void extractVideoFrames();
  }, [extractVideoFrames]);

  const handleCoverTabChange = useCallback((nextTab: CoverSourceTab) => {
    setCoverTab(nextTab);
    if (nextTab === 'video') {
      void extractVideoFrames();
    }
  }, [extractVideoFrames]);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    // 1. Native browser prompt for closing tab/refreshing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (file && status !== 'success') {
        const message = 'Bạn có chắc chắn muốn rời khỏi trang? Video chưa được lưu sẽ bị mất.';
        e.returnValue = message;
        return message;
      }
    };
    
    // 2. Custom modal for internal client-side navigation
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (!target) return;
      
      const href = target.getAttribute('href');
      // Intercept internal links only
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        if (file && status !== 'success') {
          e.preventDefault();
          e.stopPropagation();
          setPendingUrl(href);
          setShowLeaveModal(true);
        }
      }
    };
    
    // 3. Prevent browser back button using pushState
    const handlePopState = () => {
      if (file && status !== 'success') {
        // Prevent navigation by pushing state forward
        window.history.pushState(null, '', window.location.href);
        setShowLeaveModal(true);
      }
    };
    
    if (file && status !== 'success') {
      window.history.pushState(null, '', window.location.href);
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [file, status]);

  // Upload logic
  const ensureFfmpeg = async () => {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg.loaded) {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    return ffmpeg;
  };

  const doUpload = async (fileToProcess: File, metadata?: UploadMetadata) => {
    let directUploadUrl = '';
    try {
      let fileToUpload = fileToProcess;
      const shouldCompress = fileToProcess.size > 10 * 1024 * 1024;
      const trimDuration = videoTrim.endSeconds - videoTrim.startSeconds;
      const shouldTrim = trimDuration > 0.2;
      const blackPaddingSeconds = videoDuration > 0
        ? Math.max(0, videoTrim.endSeconds - videoDuration)
        : 0;

      if (shouldCompress || shouldTrim || blackPaddingSeconds > 0) {
        setStatus('compressing');
        setProgress(0);
        const ffmpeg = await ensureFfmpeg();
        ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
        await ffmpeg.writeFile('input.mp4', await fetchFile(fileToProcess));

        const args = ['-y'];
        if (shouldTrim) {
          args.push('-ss', String(Math.max(0, videoTrim.startSeconds)));
        }
        args.push('-i', 'input.mp4');
        if (shouldTrim) {
          args.push('-t', String(trimDuration));
        }
        // Calculate dynamic bitrate to keep file under ~9.5MB
        const finalDuration = shouldTrim ? trimDuration : (videoDuration > 0 ? videoDuration : 60);
        // We want total size < 9.5MB. 9.5MB = 9.5 * 8192 kbps = 77824 kb
        let targetVBitrate = Math.floor(77824 / finalDuration) - 128;
        // Keep within reasonable bounds (min 200k, max 5000k)
        targetVBitrate = Math.max(200, Math.min(5000, targetVBitrate));

        const vfFilters: string[] = [];
        if (shouldCompress) {
          vfFilters.push('scale=-2:720');
        }
        if (blackPaddingSeconds > 0) {
          vfFilters.push(`tpad=stop_mode=add:stop_duration=${blackPaddingSeconds}:color=black`);
        }
        if (vfFilters.length > 0) {
          args.push('-vf', vfFilters.join(','));
        }

        if (shouldCompress) {
          args.push(
            '-c:v', 'libx264',
            '-b:v', `${targetVBitrate}k`,
            '-maxrate', `${Math.floor(targetVBitrate * 1.5)}k`,
            '-bufsize', `${targetVBitrate * 2}k`,
            '-preset', 'veryfast',
            '-c:a', 'aac',
            '-b:a', '128k'
          );
        } else {
          args.push('-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac');
        }
        args.push('output.mp4');

        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile('output.mp4');
        const blobPart = typeof data === 'string' ? data : new Uint8Array(data);
        fileToUpload = new File([blobPart], fileToProcess.name, { type: 'video/mp4' });
      }
      setStatus('uploading');
      setProgress(0);

      // Step 1: Init R2 Upload Session
      const initRes = await initUploadMutation.mutateAsync({
        fileName: fileToUpload.name,
        contentType: fileToUpload.type || 'video/mp4',
        sizeBytes: fileToUpload.size,
      });

      if (!initRes.data || !initRes.data.uploadUrl || !initRes.data.uploadId) {
        throw new Error('Không thể khởi tạo session upload. Vui lòng thử lại.');
      }

      const { uploadUrl, uploadId } = initRes.data;
      directUploadUrl = uploadUrl;

      // Step 2: Upload directly to R2 (presigned URL PUT request)
      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          'Content-Type': fileToUpload.type || 'video/mp4',
        },
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100)));
        },
      });

      // Step 3: Complete R2 upload via Backend
      const finalMetadata = metadata || { 
        title: fileToProcess.name, 
        description: '', 
        visibility: 'PUBLIC', 
        allowComments, 
        allowEdit: false,
        soundId: selectedSound?.id ?? null,
      };
      const useAvatarAsSoundCover = !finalMetadata.soundId && !coverManuallySelected;

      const completePayload = {
        uploadId,
        title: finalMetadata.title,
        description: finalMetadata.description,
        category: finalMetadata.category,
        visibility: finalMetadata.visibility as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
        allowComments: finalMetadata.allowComments,
        allowEdit: finalMetadata.allowEdit,
        soundId: finalMetadata.soundId,
        useAvatarAsSoundCover,
        enableMusicCopyrightCheck: musicCopyrightCheckEnabled,
        enableContentModerationCheck: fastContentCheckEnabled,
        editInstructions: {
          videoTrim: {
            startSeconds: videoTrim.startSeconds,
            endSeconds: videoTrim.endSeconds,
          },
          selectedSoundId: selectedSound?.id ?? null,
          soundTrim: selectedSound ? {
            startSeconds: soundTrim.startSeconds,
            endSeconds: soundTrim.endSeconds > 0 ? soundTrim.endSeconds : null,
          } : null,
          audioMix: {
            originalAudioVolume: Math.min(1, originalAudioVolume / 100),
            soundVolume: selectedSound ? (soundMuted ? 0 : Math.min(1, soundVolume / 100)) : 0,
            soundStartAtVideoSeconds: soundStartOffset,
          },
          coverFrameSeconds: selectedCoverTime > 0 ? selectedCoverTime : null,
        },
      };

      const completeRes = await completeUploadMutation.mutateAsync({
        payload: completePayload,
        coverFile: coverFile || undefined,
      });

      if (!completeRes.data || !completeRes.data.id) {
        throw new Error('Không thể lưu thông tin video. Vui lòng thử lại.');
      }

      setUploadedVideoId(completeRes.data.id);
      setModerationResult(completeRes.data.moderationStatus ? {
        moderationStatus: completeRes.data.moderationStatus,
        reasonCode: completeRes.data.moderationReasonCode ?? null,
        reasonMessage: completeRes.data.moderationReasonMessage ?? null,
        riskScore: null,
        musicCopyrightStatus: completeRes.data.musicCopyrightStatus ?? null,
        musicCopyrightReasonCode: completeRes.data.musicCopyrightReasonCode ?? null,
        musicCopyrightReasonMessage: completeRes.data.musicCopyrightReasonMessage ?? null,
        qualityIssues: null,
        qualityIssueMessage: null,
      } : null);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      
      let msg = t('errorGeneric');
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 413) {
            msg = t('errorTooLarge');
          } else if (error.response.status === 429) {
            msg = t('errorSpam');
          } else {
            msg = toFriendlyUploadErrorMessage(
              error.response.data?.message || t('errorServer').replace('{code}', String(error.response.status)),
            );
          }
        } else if (error.request) {
          msg = directUploadUrl.includes('r2.cloudflarestorage.com')
            ? t('errorR2Cors')
            : t('errorNetwork');
        } else {
          msg = error.message;
        }
      } else if (error instanceof Error) {
        msg = toFriendlyUploadErrorMessage(error.message);
      }
      
      setErrorMessage(msg);
      throw error; // Re-throw so handlePost knows it failed
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage(t('errorVideo'));
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      setErrorMessage(t('errorTooLarge'));
      return;
    }
    clearCover();
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setVideoFrames([]);
    setSelectedCoverTime(0);
    setSelectedVideoFramePreview(null);
    setImportedCoverSource(null);
    resetCoverCrop();
    setVideoDuration(0);
    setVideoTrim({ startSeconds: 0, endSeconds: 0 });
    setUploadedVideoId(null);
    setModerationResult(null);
    setErrorMessage('');
    // Auto-upload is now disabled as requested
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace video
  const handleReplace = () => {
    document.getElementById('video-replace-input')?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (newFile && newFile.type.startsWith('video/')) {
      if (preview) URL.revokeObjectURL(preview);
      clearCover();
      setFile(newFile);
      setPreview(URL.createObjectURL(newFile));
      setVideoFrames([]);
      setSelectedCoverTime(0);
      setSelectedVideoFramePreview(null);
      setImportedCoverSource(null);
      resetCoverCrop();
      setVideoDuration(0);
      setVideoTrim({ startSeconds: 0, endSeconds: 0 });
      setUploadedVideoId(null);
      setModerationResult(null);
      setStatus('idle');
      setProgress(0);
      // Auto-upload is now disabled as requested
    }
  };

  // Description with hashtag/mention detection
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 4000) return;
    setDescription(value);
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    if (lastWord.startsWith('#') && lastWord.length >= 1) {
      setShowHashtagDropdown(true); setShowMentionDropdown(false);
      setHashtagSearch(lastWord.slice(1).toLowerCase());
    } else if (lastWord.startsWith('@') && lastWord.length >= 1) {
      setShowMentionDropdown(true); setShowHashtagDropdown(false);
      setMentionSearch(lastWord.slice(1).toLowerCase());
    } else {
      setShowHashtagDropdown(false); setShowMentionDropdown(false);
    }
  };

  const insertToken = (token: string, prefix: string) => {
    const words = description.split(/\s+/);
    words.pop();
    setDescription([...words, `${prefix}${token} `].join(' ').trimStart());
    setShowHashtagDropdown(false); setShowMentionDropdown(false);
    descRef.current?.focus();
  };

  const openHashtagMode = () => {
    setDescription(prev => prev + (prev.endsWith(' ') || !prev ? '#' : ' #'));
    setShowHashtagDropdown(true); setShowMentionDropdown(false);
    setHashtagSearch('');
    descRef.current?.focus();
  };

  const openMentionMode = () => {
    setDescription(prev => prev + (prev.endsWith(' ') || !prev ? '@' : ' @'));
    setShowMentionDropdown(true); setShowHashtagDropdown(false);
    setMentionSearch('');
    descRef.current?.focus();
  };

  // Submit post
  const handlePost = async () => {
    if (!file || submitLockRef.current || uploadMutation.isPending || status === 'uploading' || status === 'compressing') return;

    submitLockRef.current = true;
    setStatus('uploading');
    setShowHashtagDropdown(false);
    setShowMentionDropdown(false);
    
    try {
      await doUpload(file, {
        title: file.name,
        description,
        visibility,
        allowComments,
        allowEdit: allowDuet,
        soundId: selectedSound?.id ?? null,
      });
    } catch {
      // Error handled in doUpload
    } finally {
      submitLockRef.current = false;
    }
  };

  const resetAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    revokeCoverObjectUrl();
    setFile(null); setPreview(null); setDescription(''); setStatus('idle');
    setProgress(0); setErrorMessage(''); setCoverFile(null); setCoverPreview(null); setCoverManuallySelected(false);
    setUploadedVideoId(null); setModerationResult(null);
    setCoverPickerOpen(false); setCoverTab('video'); setVideoFrames([]);
    setSelectedCoverTime(0); setSelectedVideoFramePreview(null); setImportedCoverSource(null); resetCoverCrop(); setVideoDuration(0);
    setVisibility('PUBLIC'); setAllowComments(defaultAllowComments); setAllowDuet(true); setAllowStitch(true);
    setSelectedSound(null); setSoundEditorOpen(false); setSoundEditorInitialTool('edit'); setVideoTrim({ startSeconds: 0, endSeconds: 0 });
    setSoundTrim({ startSeconds: 0, endSeconds: 0 }); setSoundVolume(100); setSoundMuted(false); setOriginalAudioVolume(100); setSoundStartOffset(0);
  };

  const handleSaveDraft = async () => {
    if (!file || submitLockRef.current || uploadMutation.isPending || status === 'uploading' || status === 'compressing') return;
    submitLockRef.current = true;
    setStatus('compressing'); // Just a visual indicator
    try {
      const { saveDraft } = await import('@/utils/draft-db');
      await saveDraft({
        id: Date.now().toString(),
        file,
        coverFile: coverFile || undefined,
        title: file.name,
        description,
        visibility,
        allowComments,
        allowDuet,
        allowStitch,
        createdAt: Date.now(),
      });
      resetAll();
      router.push('/toptopstudio/manage?tab=drafts');
    } catch (e) {
      console.error('Failed to save draft', e);
      setErrorMessage(t('errorDraft'));
      setStatus('error');
    } finally {
      submitLockRef.current = false;
    }
  };

  // ============= PHASE 1: DROPZONE =============
  if (!file) {
    return <UploadDropzone onFileSelect={handleFileSelect} errorMessage={errorMessage} />;
  }

  // ============= PHASE 2: EDIT FORM (TikTok-style) =============
  const isUploading = status === 'uploading' || status === 'compressing';
  const uploadLocked = isUploading || uploadMutation.isPending;
  const coverImageStyle = {
    left: `${coverImageX}px`,
    top: `${coverImageY}px`,
    height: `${coverCropZoom * 100}%`,
  } as React.CSSProperties;

  const renderCoverCropWorkspace = (imageSource: string | null) => (
    <div
      ref={coverWorkspaceRef}
      onPointerDown={beginCoverDrag}
      onPointerMove={updateCoverDrag}
      onPointerUp={endCoverDrag}
      onPointerCancel={endCoverDrag}
      className="relative flex h-[min(72dvh,760px)] min-h-[480px] cursor-grab touch-none items-center justify-center overflow-hidden rounded-xl border border-elevated bg-black active:cursor-grabbing"
    >
      {imageSource ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={coverImageRef}
            src={imageSource}
            alt={t('coverSelectedPreview')}
            className="absolute max-w-none select-none"
            style={coverImageStyle}
            draggable={false}
            onLoad={() => centerCoverImage()}
          />
          <div
            ref={coverCropFrameRef}
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-[9/16] h-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.48)]"
          >
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
          </div>
          <span className="absolute right-3 top-3 rounded bg-black/65 px-2 py-1 text-xs font-bold text-white">
            9:16
          </span>
          <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-xs font-semibold text-text-primary shadow-lg backdrop-blur">
            <span>{t('coverZoom')}</span>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.01}
              value={coverCropZoom}
              onChange={(event) => handleCoverZoomChange(Number(event.target.value))}
              onPointerDown={(event) => event.stopPropagation()}
              className="w-28 accent-brand"
            />
          </div>
        </>
      ) : (
        <div className="h-24 w-16 animate-pulse rounded bg-elevated" />
      )}
    </div>
  );

  const contentModerationStatus = moderationResult?.moderationStatus;
  const contentCheckPending = isUploading || (status === 'success' && (!contentModerationStatus || contentModerationStatus === 'PENDING'));
  const contentCheckApproved = contentModerationStatus === 'APPROVED';
  const contentCheckNeedsReview = contentModerationStatus === 'NEED_REVIEW';
  const contentCheckRejected = contentModerationStatus === 'REJECTED';
  const musicCopyrightStatus = moderationResult?.musicCopyrightStatus;
  const musicCheckPending = isUploading || (status === 'success' && (!musicCopyrightStatus || musicCopyrightStatus === 'PENDING'));
  const musicCheckApproved = musicCopyrightStatus === 'APPROVED';
  const musicCheckNeedsReview = musicCopyrightStatus === 'NEED_REVIEW';
  const musicCheckRejected = musicCopyrightStatus === 'REJECTED';

  const fastCheckPending = contentCheckPending;
  const hasFastCheckIssues = Boolean(moderationResult?.qualityIssues && moderationResult.qualityIssues.length > 0);
  const showCheckToggles = !uploadLocked && status !== 'success';

  const checksApproved = contentCheckApproved;
  const checksRejected = contentCheckRejected;
  const checksNeedReview = contentCheckNeedsReview || contentCheckPending;
  const completionTitle = checksApproved
    ? t('publishedTitle')
    : checksRejected
      ? t('rejectedTitle')
      : t('reviewTitle');
  const completionMessage = checksApproved
    ? t('publishedMsg')
    : checksRejected
      ? t('rejectedMsg')
      : checksNeedReview
        ? t('reviewMsg')
        : t('successMsg');

  const renderCheckStatus = ({
    tone,
    text,
    spinning = false,
  }: {
    tone: 'success' | 'pending' | 'warning' | 'error' | 'muted';
    text: string;
    spinning?: boolean;
  }) => {
    const toneClass = {
      success: 'text-emerald-600 dark:text-emerald-400',
      pending: 'text-text-muted',
      warning: 'text-amber-600 dark:text-amber-400',
      error: 'text-red-600 dark:text-red-400',
      muted: 'text-text-muted',
    }[tone];

    if (spinning) {
      return (
        <p className={`mt-2 flex items-center gap-1.5 text-sm ${toneClass}`}>
          <RefreshCw size={14} className="animate-spin" />
          {text}
        </p>
      );
    }

    const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;

    return (
      <p className={`mt-2 flex items-center gap-1.5 text-sm ${toneClass}`}>
        <Icon size={14} />
        {text}
      </p>
    );
  };

  const renderModerationChecks = () => (
    <section className="mb-8">
      <h3 className="text-base font-bold text-text-primary mb-4">Kiểm tra</h3>
      <div className="rounded-xl border border-elevated bg-background px-6 py-5 space-y-6">
        {/* Row 1: Music Copyright Check */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-text-primary">Kiểm tra bản quyền nhạc</span>
              <span title="Kiểm tra xem âm thanh trong video của bạn có vi phạm bản quyền hay không.">
                <AlertCircle size={14} className="text-text-muted cursor-help" />
              </span>
            </div>
            {showCheckToggles && (
              <button
                type="button"
                onClick={() => setMusicCopyrightCheckEnabled(!musicCopyrightCheckEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${musicCopyrightCheckEnabled ? 'bg-cyan' : 'bg-elevated'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${musicCopyrightCheckEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            )}
          </div>
          <div className="mt-1 pl-1">
            {!musicCopyrightCheckEnabled && renderCheckStatus({
              tone: 'muted',
              text: 'Đã tắt kiểm tra bản quyền nhạc.',
            })}
            {musicCopyrightCheckEnabled && (
              <>
                {musicCheckPending && renderCheckStatus({
                tone: 'pending',
                text: t('musicCheckRunning'),
                spinning: true,
              })}
              {!musicCheckPending && musicCheckApproved && renderCheckStatus({
                tone: 'success',
                text: t('noIssueDetected'),
              })}
              {!musicCheckPending && musicCheckNeedsReview && renderCheckStatus({
                tone: 'warning',
                text: moderationResult?.musicCopyrightReasonMessage || t('musicNeedReviewShort'),
              })}
              {!musicCheckPending && musicCheckRejected && renderCheckStatus({
                tone: 'warning',
                text: moderationResult?.musicCopyrightReasonMessage || t('musicRejectedShort'),
              })}
              {!musicCheckPending && !musicCheckApproved && !musicCheckNeedsReview && !musicCheckRejected && renderCheckStatus({
                tone: 'muted',
                text: t('checkWillRun'),
              })}
              </>
            )}
          </div>
        </div>

        {/* Row 2: Text Moderation */}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-text-primary">Kiểm duyệt văn bản</span>
            <span title="Kiểm tra tiêu đề, mô tả và hashtag. Mục này chạy theo tùy chọn kiểm tra nội dung nhanh.">
              <AlertCircle size={14} className="text-text-muted cursor-help" />
            </span>
          </div>
          <div className="mt-1 pl-1">
            {!fastContentCheckEnabled && renderCheckStatus({
              tone: 'muted',
              text: 'Đã tắt theo kiểm tra nội dung nhanh.',
            })}
            {fastContentCheckEnabled && contentCheckPending && renderCheckStatus({
              tone: 'pending',
              text: 'Đang kiểm tra tiêu đề, mô tả và hashtag...',
              spinning: true,
            })}
            {fastContentCheckEnabled && !contentCheckPending && contentCheckApproved && renderCheckStatus({
              tone: 'success',
              text: 'Không phát hiện vấn đề trong văn bản.',
            })}
            {fastContentCheckEnabled && !contentCheckPending && contentCheckNeedsReview && renderCheckStatus({
              tone: 'warning',
              text: moderationResult?.reasonMessage || 'Văn bản cần được kiểm duyệt thủ công.',
            })}
            {fastContentCheckEnabled && !contentCheckPending && contentCheckRejected && renderCheckStatus({
              tone: 'error',
              text: moderationResult?.reasonMessage || 'Văn bản bị từ chối bởi kiểm duyệt.',
            })}
            {fastContentCheckEnabled && !contentCheckPending && !moderationResult && renderCheckStatus({
              tone: 'muted',
              text: t('checkWillRun'),
            })}
          </div>
        </div>

        {/* Row 3: Fast Content Check */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-text-primary">Kiểm tra nội dung nhanh</span>
              <span title="Kiểm tra chất lượng video, logo/watermark và mã QR.">
                <AlertCircle size={14} className="text-text-muted cursor-help" />
              </span>
            </div>
            {showCheckToggles && (
              <button
                type="button"
                onClick={() => setFastContentCheckEnabled(!fastContentCheckEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${fastContentCheckEnabled ? 'bg-cyan' : 'bg-elevated'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${fastContentCheckEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            )}
          </div>
          <div className="mt-1 pl-1">
            {!fastContentCheckEnabled && renderCheckStatus({
              tone: 'muted',
              text: 'Đã tắt kiểm tra nội dung nhanh.',
            })}
            {fastContentCheckEnabled && (
              <>
                {fastCheckPending && renderCheckStatus({
                tone: 'pending',
                text: 'Đang tiến hành kiểm tra nội dung nhanh...',
                spinning: true,
              })}
              {!fastCheckPending && moderationResult && !hasFastCheckIssues && renderCheckStatus({
                tone: 'success',
                text: 'Không phát hiện vấn đề nào.',
              })}
              {!fastCheckPending && moderationResult && hasFastCheckIssues && (
                <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      Nội dung có thể sẽ bị hạn chế. Bạn vẫn có thể đăng bài, nhưng để cải thiện khả năng hiển thị, bạn nên sửa đổi để tuân thủ nguyên tắc của chúng tôi.{' '}
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(true)}
                        className="text-red-500 hover:underline font-semibold"
                      >
                        Xem chi tiết
                      </button>
                    </p>
                  </div>
                </div>
              )}
              {!fastCheckPending && !moderationResult && renderCheckStatus({
                tone: 'muted',
                text: t('checkWillRun'),
              })}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Detail Modal for Quality Issues */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-opacity-solid relative w-full max-w-2xl bg-background border border-elevated rounded-2xl shadow-2xl overflow-hidden text-text-primary max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-elevated">
              <span className="text-lg font-bold">Kiểm tra chi tiết</span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Warning Header */}
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-elevated">
                <AlertCircle size={48} className="text-amber-500 animate-pulse" />
                <h3 className="text-xl font-bold">Nội dung có thể sẽ bị hạn chế</h3>
                <p className="text-sm text-text-secondary max-w-lg leading-relaxed">
                  Bạn vẫn có thể đăng bài, nhưng để cải thiện khả năng hiển thị, bạn nên sửa đổi để tuân thủ nguyên tắc của chúng tôi.
                </p>
              </div>

              {/* Lý do vi phạm */}
              <div className="bg-background border border-elevated rounded-xl p-5">
                <h4 className="font-bold text-sm mb-3">Lý do vi phạm</h4>
                <p className="font-semibold text-sm text-amber-500 mb-2">
                  {moderationResult?.qualityIssueMessage || "Nội dung không phải là nguyên tác hoặc có chất lượng thấp"}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Để duy trì trải nghiệm tích cực cho người dùng trên nền tảng TopTop, nội dung không phải nguyên tác và có chất lượng thấp sẽ không đủ điều kiện để được đề xuất. Nội dung không phải nguyên tác là nội dung chỉ được nhập hoặc sao chép từ các nguồn khác mà không có sự chỉnh sửa mới mẻ, sáng tạo. Video có thể không phải là nguyên tác nếu có hình mờ hoặc logo trên đó. Nội dung chất lượng thấp bao gồm các video rất ngắn, ảnh tĩnh và video chỉ gồm toàn ảnh GIF.
                </p>
              </div>

              {/* Chi tiết vi phạm */}
              <div>
                <h4 className="font-bold text-sm mb-3">Chi tiết vi phạm</h4>
                <p className="text-xs text-text-secondary mb-4">Đã phát hiện một số hành vi vi phạm tiềm ẩn.</p>
                
                <div className="flex gap-4 items-start">
                  <div className="relative aspect-[9/16] w-[140px] rounded-lg overflow-hidden border border-elevated bg-black flex-shrink-0">
                    {preview ? (
                      <video src={preview} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">No Preview</div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      00:00-00:48
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <span className="px-2 py-0.5 bg-elevated rounded">Vi phạm chất lượng</span>
                      <span>&middot;</span>
                      <span>Mức độ: Cảnh báo</span>
                    </div>
                    <ul className="text-xs text-text-secondary space-y-1.5 list-disc pl-4">
                      {moderationResult?.qualityIssues?.includes("WATERMARK") && (
                        <li>Video chứa watermark, hình mờ hoặc logo của nền tảng/ứng dụng chỉnh sửa khác.</li>
                      )}
                      {moderationResult?.qualityIssues?.includes("QR_CODE") && (
                        <li>Phát hiện mã QR code hoặc thông tin quảng cáo hướng ngoại.</li>
                      )}
                      {moderationResult?.qualityIssues?.includes("LOW_QUALITY") && (
                        <li>Video có độ phân giải thấp, mờ nhạt hoặc quá tối.</li>
                      )}
                      {(!moderationResult?.qualityIssues || moderationResult.qualityIssues.length === 0) && (
                        <li>Video có thể chứa watermark hoặc không đủ độ phân giải tiêu chuẩn.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-elevated bg-background">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-lg border border-elevated hover:bg-hover font-semibold text-sm transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  const replaceInput = document.getElementById('video-replace-input');
                  if (replaceInput) replaceInput.click();
                }}
                className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Thay thế video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {status === 'success' && (
        <div className="bg-background rounded-xl border border-elevated p-12 flex flex-col items-center text-center max-w-2xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-950/10">
            <CheckCircle2 size={40} className="text-green-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-text-primary">{completionTitle}</h2>
          <p className="text-text-secondary mb-8">{completionMessage}</p>
          
          <div className="w-full text-left">
            {renderModerationChecks()}
          </div>

          <button onClick={resetAll} className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-brand/20 active:scale-95 duration-150">
            {t('uploadNext')}
          </button>
        </div>
      )}

      {status !== 'success' && (
        <>
          {/* FILE HEADER - like TikTok */}
          <div className="bg-background rounded-xl border border-elevated p-5 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-text-primary truncate">{file.name}</span>
                {status === 'uploaded' && (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium flex-shrink-0">
                    <CheckCircle2 size={14} />
                    {t('uploaded')} ({formatFileSize(file.size)})
                  </span>
                )}
                {isUploading && (
                  <span className="text-sm text-text-muted flex-shrink-0">
                    {formatFileSize(file.size)} &middot; {progress}%
                  </span>
                )}
                {status === 'error' && (
                  <span className="flex items-center gap-1 text-red-500 text-sm flex-shrink-0">
                    <AlertCircle size={14} /> {errorMessage}
                  </span>
                )}
              </div>
              {status === 'uploaded' && (
                <button onClick={handleReplace} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors flex-shrink-0">
                  <RefreshCw size={14} /> {t('replace')}
                </button>
              )}
              <input id="video-replace-input" type="file" accept="video/*" className="hidden" onChange={handleReplaceFile} disabled={uploadLocked} />
            </div>
            {/* Progress bar */}
            {(isUploading || status === 'uploaded') && (
              <div className="w-full h-1 bg-elevated rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: status === 'uploaded' ? '#22c55e' : 'linear-gradient(90deg, #25F4EE, #FE2C55)',
                  }}
                />
              </div>
            )}
          </div>

          {/* MAIN CONTENT: Two columns - responsive */}
          <div className="relative flex flex-col-reverse lg:flex-row gap-6 mt-6" aria-busy={uploadLocked}>
            {/* LEFT: Form */}
            <div className="flex-1 min-w-0">
              {/* Details Section */}
              <h3 className="text-base font-bold text-text-primary mb-4">{t('details')}</h3>

              {/* Description */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('description')}</label>
                <div className="relative">
                  <div className="border border-elevated rounded-lg bg-background focus-within:border-text-muted transition-colors">
                    <textarea
                      ref={descRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      disabled={uploadLocked}
                      placeholder={t('descriptionPlaceholder')}
                      rows={5}
                      maxLength={4000}
                      className="w-full px-4 py-3 bg-transparent outline-none resize-none text-text-primary text-sm disabled:cursor-wait"
                    />
                    {/* Bottom bar with # @ and char count */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-elevated">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={openHashtagMode} disabled={uploadLocked} className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover disabled:cursor-wait disabled:hover:bg-transparent disabled:hover:text-text-secondary rounded transition-colors">
                          <Hash size={14} /> {t('hashtag')}
                        </button>
                        <button type="button" onClick={openMentionMode} disabled={uploadLocked} className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover disabled:cursor-wait disabled:hover:bg-transparent disabled:hover:text-text-secondary rounded transition-colors">
                          <AtSign size={14} /> {t('mention')}
                        </button>
                      </div>
                      <span className="text-xs text-text-muted">{description.length}/4000</span>
                    </div>
                  </div>

                  {/* Hashtag Dropdown */}
                  {showHashtagDropdown && (loadingHashtags || hashtags.length > 0) && (
                    <div className="select-options-solid absolute left-0 right-0 top-full mt-1 bg-background border border-elevated rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                      {loadingHashtags ? (
                        <div className="p-4 text-center text-sm text-text-muted">{t('suggestionLoading')}</div>
                      ) : hashtags.map((tag: HashtagSuggestion) => (
                        <button key={tag.id} onClick={() => insertToken(tag.name, '#')} className="w-full px-4 py-2.5 hover:bg-hover flex justify-between items-center text-left transition-colors">
                          <span className="font-semibold text-sm">#{tag.name}</span>
                          <span className="text-xs text-text-muted">{tag.formattedPostCount} {t('posts')}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mention Dropdown */}
                  {showMentionDropdown && (loadingMentions || mentions.length > 0) && (
                    <div className="select-options-solid absolute left-0 right-0 top-full mt-1 bg-background border border-elevated rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                      {loadingMentions ? (
                        <div className="p-4 text-center text-sm text-text-muted">{t('suggestionLoading')}</div>
                      ) : mentions.map((u: MentionSuggestion) => (
                        <button key={u.id} onClick={() => insertToken(u.username, '@')} className="w-full px-4 py-2.5 hover:bg-hover flex items-center gap-3 text-left transition-colors">
                          {u.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold">{u.username[0].toUpperCase()}</div>
                          )}
                          <div>
                            <p className="text-sm font-semibold flex items-center gap-1">{u.displayName} {u.verified && <CheckCircle2 size={12} className="text-cyan" />}</p>
                            <p className="text-xs text-text-muted">@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cover */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('cover')}</label>
                <div className="flex gap-3">
                  {coverPreview ? (
                    <div className="relative aspect-[9/16] w-[120px] rounded-lg overflow-hidden border border-elevated group">
                      <button
                        type="button"
                        onClick={openCoverPicker}
                        disabled={uploadLocked}
                        className="absolute inset-0 text-left"
                      >
                        <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-medium">
                          {t('editCover')}
                        </div>
                      </button>
                      <button type="button" onClick={clearCover} disabled={uploadLocked} className="absolute top-1 right-1 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 disabled:cursor-wait">
                        <X size={12} />
                      </button>
                    </div>
                  ) : preview ? (
                    <button
                      type="button"
                      onClick={openCoverPicker}
                      disabled={uploadLocked}
                      className="relative aspect-[9/16] w-[120px] rounded-lg overflow-hidden border border-elevated cursor-pointer group"
                    >
                      <video src={preview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-medium">
                        {t('editCover')}
                      </div>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* DIVIDER */}
              <hr className="border-elevated mb-6" />

              {/* SETTINGS */}
              <h3 className="text-base font-bold text-text-primary mb-4">{t('settings')}</h3>

              {/* Visibility */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('whoCanWatch')}</label>
                <div ref={visibilityDropdownRef} className="relative w-full max-w-[260px]">
                  <button
                    type="button"
                    disabled={uploadLocked}
                    aria-haspopup="listbox"
                    aria-expanded={visibilityDropdownOpen}
                    onClick={() => setVisibilityDropdownOpen((open) => !open)}
                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-left text-sm font-semibold transition-colors ${
                      visibilityDropdownOpen
                        ? 'border-text-muted bg-surface text-text-primary'
                        : 'border-elevated bg-background text-text-primary hover:bg-hover'
                    } disabled:cursor-wait disabled:hover:bg-background`}
                  >
                    <span className="truncate">{selectedVisibilityOption.label}</span>
                    <ChevronDown
                      size={16}
                      className={`ml-3 shrink-0 text-text-muted transition-transform ${visibilityDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {visibilityDropdownOpen && (
                    <div
                      role="listbox"
                      data-select-menu
                      className="select-options-solid absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-elevated bg-background shadow-2xl"
                    >
                      {visibilityOptions.map((option) => {
                        const selected = option.value === visibility;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setVisibility(option.value);
                              setVisibilityDropdownOpen(false);
                            }}
                            className={`flex h-11 w-full items-center justify-between px-3.5 text-left text-sm transition-colors ${
                              selected
                                ? 'bg-brand/10 font-bold text-brand'
                                : 'font-medium text-text-primary hover:bg-hover'
                            }`}
                          >
                            <span className="truncate">{option.label}</span>
                            {selected ? <Check size={16} className="shrink-0" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 mb-8">
                {[
                  { label: t('allowComments'), value: allowComments, onChange: setAllowComments },
                  { label: t('allowDuet'), value: allowDuet, onChange: setAllowDuet },
                  { label: t('allowStitch'), value: allowStitch, onChange: setAllowStitch },
                ].map((toggle, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{toggle.label}</span>
                    <button
                      type="button"
                      onClick={() => toggle.onChange(!toggle.value)}
                      disabled={uploadLocked}
                      className={`relative w-11 h-6 rounded-full transition-colors disabled:cursor-wait ${toggle.value ? 'bg-brand' : 'bg-elevated'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${toggle.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {renderModerationChecks()}

              {/* Error */}
              {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 mb-6">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Không thể đăng video</p>
            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        </div>
      )}

              {/* BOTTOM ACTION BAR */}
              <div className="flex items-center gap-3 pt-4 border-t border-elevated">
                <button
                  onClick={handlePost}
                  disabled={!file || uploadLocked}
                  className="inline-flex min-w-[120px] items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:bg-elevated disabled:text-text-muted text-white font-semibold px-8 py-2.5 rounded-md transition-colors"
                >
                  {uploadLocked ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      {t('postBtn')}
                    </>
                  ) : (
                    t('postBtn')
                  )}
                </button>
                {!isUploading && !uploadMutation.isPending && (
                  <>
                    <button onClick={handleSaveDraft} className="px-6 py-2.5 border border-elevated rounded-md text-sm font-medium text-text-secondary hover:bg-hover transition-colors">
                      {t('saveDraft')}
                    </button>
                    <button onClick={() => setShowLeaveModal(true)} className="px-6 py-2.5 border border-elevated rounded-md text-sm font-medium text-text-secondary hover:bg-hover transition-colors">
                      {t('cancel')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Preview — visible on all screens */}
            <div className="w-full lg:w-[300px] flex-shrink-0">
              <div className="lg:sticky lg:top-8">
                <VideoPreviewPhone
                  previewUrl={preview}
                  previewMode={previewMode}
                  onModeChange={setPreviewMode}
                  description={description}
                  username={user?.username || 'you'}
                  soundTitle={selectedSound?.title}
                  soundUrl={selectedSound?.audioUrl}
                  soundDurationSeconds={selectedSound?.durationSeconds}
                  paused={soundEditorOpen}
                  trimStartSeconds={videoTrim.startSeconds}
                  trimEndSeconds={videoTrim.endSeconds}
                  soundTrimStartSeconds={soundTrim.startSeconds}
                  soundTrimEndSeconds={soundTrim.endSeconds}
                  soundStartAtVideoSeconds={soundStartOffset}
                  soundVolume={soundVolume}
                  soundMuted={soundMuted}
                  originalAudioVolume={originalAudioVolume}
                />
                
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSoundEditorInitialTool('edit');
                      setSoundEditorOpen(true);
                    }}
                    disabled={uploadLocked}
                    className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-elevated bg-background text-sm font-medium text-text-primary transition-colors hover:bg-hover disabled:cursor-wait disabled:hover:bg-background"
                  >
                    <Scissors size={22} />
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSoundEditorInitialTool('sound');
                      setSoundEditorOpen(true);
                    }}
                    disabled={uploadLocked}
                    className={`flex h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 text-sm font-medium transition-colors ${
                      selectedSound
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-elevated bg-background text-text-primary hover:bg-hover'
                    } disabled:cursor-wait disabled:hover:bg-background`}
                  >
                    <Music size={22} />
                    <span>{t('sound')}</span>
                    {selectedSound ? <span className="max-w-full truncate text-xs text-text-muted">{selectedSound.title}</span> : null}
                  </button>
                  <button
                    type="button"
                    disabled={uploadLocked}
                    className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-elevated bg-background text-sm font-medium text-text-primary transition-colors hover:bg-hover disabled:cursor-wait disabled:hover:bg-background"
                  >
                    <Type size={22} />
                    {t('text')}
                  </button>
                </div>
              </div>
            </div>
            {uploadLocked && (
              <div
                className="absolute inset-0 z-40 cursor-wait rounded-xl bg-background/10"
                aria-hidden="true"
              />
            )}
          </div>
        </>
      )}

      <SoundEditorPanel
        isOpen={soundEditorOpen}
        initialTool={soundEditorInitialTool}
        previewUrl={preview}
        description={description}
        selectedSound={selectedSound}
        trimStartSeconds={videoTrim.startSeconds}
        trimEndSeconds={videoTrim.endSeconds}
        soundTrimStartSeconds={soundTrim.startSeconds}
        soundTrimEndSeconds={soundTrim.endSeconds}
        soundVolume={soundVolume}
        soundMuted={soundMuted}
        originalAudioVolume={originalAudioVolume}
        soundStartAtVideoSeconds={soundStartOffset}
        onSelectSound={setSelectedSound}
        onTrimChange={setVideoTrim}
        onSoundTrimChange={setSoundTrim}
        onSoundVolumeChange={setSoundVolume}
        onSoundMutedChange={setSoundMuted}
        onOriginalAudioVolumeChange={setOriginalAudioVolume}
        onSoundStartAtVideoSecondsChange={setSoundStartOffset}
        onClose={() => setSoundEditorOpen(false)}
      />

      {coverPickerOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="modal-opacity-solid flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-elevated bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-elevated px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{t('editCover')}</h3>
                <p className="mt-0.5 text-sm text-text-muted">{t('coverPickerSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setCoverPickerOpen(false)}
                className="rounded-full p-2 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-elevated px-5 pt-4">
              <div className="inline-flex rounded-lg bg-elevated/40 p-1">
                <button
                  type="button"
                  onClick={() => handleCoverTabChange('video')}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    coverTab === 'video'
                      ? 'bg-background text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Film size={16} />
                  {t('coverFromVideo')}
                </button>
                <button
                  type="button"
                  onClick={() => handleCoverTabChange('upload')}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    coverTab === 'upload'
                      ? 'bg-background text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ImagePlus size={16} />
                  {t('coverFromDevice')}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {coverTab === 'video' ? (
                <div className="space-y-5">
                  <video
                    ref={coverVideoRef}
                    src={preview ?? undefined}
                    muted
                    playsInline
                    preload="metadata"
                    className="hidden"
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
                      setVideoDuration(duration);
                      setVideoTrim((prev) => prev.endSeconds === 0 ? { startSeconds: 0, endSeconds: Math.min(duration, 60) } : prev);

                      const initialTime = selectedCoverTime || Math.min(duration * 0.25, Math.max(duration - 0.1, 0));
                      setSelectedCoverTime(initialTime);
                      video.currentTime = initialTime;
                    }}
                    onSeeked={(event) => {
                      const frame = captureVideoFrame(event.currentTarget, event.currentTarget.currentTime);
                      if (frame) {
                        setSelectedCoverTime(frame.timestamp);
                        setSelectedVideoFramePreview(frame.dataUrl);
                      }
                    }}
                  />

                  {renderCoverCropWorkspace(selectedVideoFramePreview)}

                  <div className="rounded-xl border border-elevated bg-elevated/20 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-text-primary">{t('coverDragHint')}</span>
                      <span className="font-mono text-xs text-text-muted">
                        {formatTimestamp(selectedCoverTime)} / {formatTimestamp(videoDuration)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(videoDuration, 0.1)}
                      step={0.05}
                      value={Math.min(selectedCoverTime, Math.max(videoDuration, 0.1))}
                      onChange={(event) => seekCoverPreview(Number(event.target.value))}
                      className="w-full accent-brand"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {framesLoading && videoFrames.length === 0 && (
                      Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="h-20 w-14 flex-shrink-0 animate-pulse rounded-md bg-elevated" />
                      ))
                    )}

                    {!framesLoading && videoFrames.length === 0 && (
                      <div className="w-full rounded-lg border border-dashed border-elevated p-8 text-center">
                        <p className="text-sm font-medium text-text-secondary">{t('coverFramesEmpty')}</p>
                        <button
                          type="button"
                          onClick={() => void extractVideoFrames()}
                          className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                        >
                          {t('coverGenerateFrames')}
                        </button>
                      </div>
                    )}

                    {videoFrames.map((frame, index) => (
                      <button
                        type="button"
                        key={`${frame.timestamp}-${index}`}
                        onClick={() => seekCoverPreview(frame.timestamp)}
                        className={`group relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-elevated transition-all ${
                          Math.abs(selectedCoverTime - frame.timestamp) < 0.1
                            ? 'border-brand ring-2 ring-brand/40'
                            : 'border-elevated hover:border-text-muted'
                        }`}
                      >
                        <Image
                          src={frame.dataUrl}
                          alt={`${t('coverFromVideo')} ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                          {formatTimestamp(frame.timestamp)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 border-t border-elevated pt-4">
                    <button
                      type="button"
                      onClick={() => setCoverPickerOpen(false)}
                      className="rounded-md border border-elevated px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={setCurrentVideoFrameCover}
                      disabled={!selectedVideoFramePreview}
                      className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:bg-elevated disabled:text-text-muted"
                    >
                      {t('coverUseCropped')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {!importedCoverSource ? (
                    <label className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-elevated bg-elevated/20 p-8 text-center transition-colors hover:border-text-muted hover:bg-hover">
                      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-background text-text-secondary">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-bold text-text-primary">{t('coverImportTitle')}</span>
                      <span className="mt-1 text-sm text-text-muted">{t('coverImportHint')}</span>
                      <input
                        type="file"
                        accept="image/jpg,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const selectedCover = event.target.files?.[0];
                          if (selectedCover) {
                            setImportedCoverForCrop(selectedCover);
                          }
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  ) : (
                    <>
                      {renderCoverCropWorkspace(importedCoverSource)}

                      <div className="flex flex-wrap justify-between gap-3 border-t border-elevated pt-4">
                        <label className="cursor-pointer rounded-md border border-elevated px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary">
                          {t('coverChooseAnother')}
                          <input
                            type="file"
                            accept="image/jpg,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                              const selectedCover = event.target.files?.[0];
                              if (selectedCover) {
                                setImportedCoverForCrop(selectedCover);
                              }
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCoverPickerOpen(false)}
                            className="rounded-md border border-elevated px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={setCurrentImportedCover}
                            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                          >
                            {t('coverUseCropped')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
          <div className="modal-opacity-solid bg-background border border-elevated rounded-xl shadow-2xl w-[90%] max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-text-primary mb-2">{t('leaveModalTitle')}</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              {t('leaveModalDesc')}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingUrl(null);
                }}
                className="px-6 py-2.5 rounded-md font-semibold text-text-primary hover:bg-elevated transition-colors"
              >
                {t('leaveModalContinue')}
              </button>
              <button 
                onClick={() => {
                  setShowLeaveModal(false);
                  if (pendingUrl) {
                    router.push(pendingUrl);
                  } else {
                    resetAll();
                  }
                }}
                className="px-6 py-2.5 rounded-md font-semibold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
              >
                {t('leaveModalDiscard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
