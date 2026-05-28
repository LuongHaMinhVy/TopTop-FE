'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Film,
  ListFilter,
  Maximize,
  Minus,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDebounce } from '@/hooks/useDebounce';
import { useSounds } from '@/hooks/sound-hooks';
import { Logo } from '@/components/layout/LayoutHelpers';
import type { Sound } from '@/types/sound';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';

type SoundTab = 'suggested' | 'favorites' | 'unlimited' | 'recent';
type EditorTool = 'edit' | 'sound' | 'text';
type DurationFilter = 'all' | 'under60' | 'over60';

interface SoundEditorPanelProps {
  isOpen: boolean;
  initialTool?: EditorTool;
  previewUrl: string | null;
  description: string;
  selectedSound?: Sound | null;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  soundTrimStartSeconds?: number;
  soundTrimEndSeconds?: number;
  soundVolume?: number;
  soundMuted?: boolean;
  originalAudioVolume?: number;
  soundStartAtVideoSeconds?: number;
  showTextTool?: boolean;
  onSelectSound: (sound: Sound | null) => void;
  onTrimChange?: (trim: { startSeconds: number; endSeconds: number }) => void;
  onSoundTrimChange?: (trim: { startSeconds: number; endSeconds: number }) => void;
  onSoundVolumeChange?: (volume: number) => void;
  onSoundMutedChange?: (muted: boolean) => void;
  onOriginalAudioVolumeChange?: (volume: number) => void;
  onSoundStartAtVideoSecondsChange?: (seconds: number) => void;
  onClose: () => void;
}

const tabs: SoundTab[] = ['suggested', 'favorites', 'unlimited', 'recent'];

const formatDuration = (seconds?: number | null) => {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
};

const getSoundArtist = (sound: Sound) => sound.artistName || sound.owner?.displayName || sound.owner?.username || '';

export function SoundEditorPanel({
  isOpen,
  initialTool = 'sound',
  previewUrl,
  description,
  selectedSound,
  trimStartSeconds: initialTrimStartSeconds = 0,
  trimEndSeconds: initialTrimEndSeconds = 0,
  soundTrimStartSeconds: initialSoundTrimStartSeconds = 0,
  soundTrimEndSeconds: initialSoundTrimEndSeconds = 0,
  soundVolume: initialSoundVolume = 100,
  soundMuted: initialSoundMuted = false,
  originalAudioVolume: initialOriginalAudioVolume = 100,
  soundStartAtVideoSeconds: initialSoundStartAtVideoSeconds = 0,
  showTextTool = true,
  onSelectSound,
  onTrimChange,
  onSoundTrimChange,
  onSoundVolumeChange,
  onSoundMutedChange,
  onOriginalAudioVolumeChange,
  onSoundStartAtVideoSecondsChange,
  onClose,
}: SoundEditorPanelProps) {
  const t = useTranslations('sound');
  const [keyword, setKeyword] = useState('');
  const [activeTool, setActiveTool] = useState<EditorTool>(initialTool);
  const [activeTab, setActiveTab] = useState<SoundTab>('suggested');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [previewingSoundId, setPreviewingSoundId] = useState<number | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [, setVideoCurrentTime] = useState(0);
  const [timelineCurrentTime, setTimelineCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [trimStartPercent, setTrimStartPercent] = useState(0);
  const [trimEndPercent, setTrimEndPercent] = useState(100);
  const [soundTrimStartPercent, setSoundTrimStartPercent] = useState(0);
  const [soundTrimEndPercent, setSoundTrimEndPercent] = useState(100);
  const [soundVolume, setSoundVolume] = useState(initialSoundVolume);
  const [soundMuted, setSoundMuted] = useState(initialSoundMuted);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(initialOriginalAudioVolume);
  const [soundStartOffset, setSoundStartOffset] = useState(initialSoundStartAtVideoSeconds);
  const [localSelectedSound, setLocalSelectedSound] = useState<Sound | null>(null);
  const [rightSoundPanelOpen, setRightSoundPanelOpen] = useState(true);
  const [visibleTimelineSeconds, setVisibleTimelineSeconds] = useState(120);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoViewportRef = useRef<HTMLDivElement | null>(null);
  const timelineContentRef = useRef<HTMLDivElement | null>(null);
  const timelineAudioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const soundTimelineRef = useRef<HTMLDivElement | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const playbackStartedAtRef = useRef(0);
  const playbackStartTimeRef = useRef(0);
  const timelineCurrentTimeRef = useRef(0);
  const internalMediaPauseRef = useRef(false);
  const resumeAfterPlayheadDragRef = useRef(false);
  const lastOriginalAudioVolumeRef = useRef(initialOriginalAudioVolume > 0 ? initialOriginalAudioVolume : 50);
  const lastSoundVolumeRef = useRef(initialSoundVolume > 0 ? initialSoundVolume : 50);

  const effectiveOriginalAudioVolume = isVideoMuted ? 0 : originalAudioVolume;
  const effectiveSoundVolume = soundMuted ? 0 : soundVolume;

  const applyOriginalAudioVolume = (nextVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, nextVolume));
    const nextMuted = clampedVolume <= 0;
    if (clampedVolume > 0) {
      lastOriginalAudioVolumeRef.current = clampedVolume;
    }

    setOriginalAudioVolume(clampedVolume);
    setIsVideoMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = Math.min(1, clampedVolume / 100);
    }
  };

  const applySoundVolume = (nextVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, nextVolume));
    const nextMuted = clampedVolume <= 0;
    if (clampedVolume > 0) {
      lastSoundVolumeRef.current = clampedVolume;
    }

    setSoundVolume(clampedVolume);
    setSoundMuted(nextMuted);

    if (timelineAudioRef.current) {
      timelineAudioRef.current.volume = nextMuted ? 0 : Math.min(1, clampedVolume / 100);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const frameId = requestAnimationFrame(() => setLocalSelectedSound(selectedSound || null));
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, selectedSound]);

  useEffect(() => {
    if (!isOpen) return;
    const frameId = requestAnimationFrame(() => {
      setSoundVolume(initialSoundVolume);
      setSoundMuted(initialSoundMuted);
      setOriginalAudioVolume(initialOriginalAudioVolume);
      setIsVideoMuted(initialOriginalAudioVolume <= 0);
      lastSoundVolumeRef.current = initialSoundVolume > 0 ? initialSoundVolume : lastSoundVolumeRef.current;
      lastOriginalAudioVolumeRef.current = initialOriginalAudioVolume > 0 ? initialOriginalAudioVolume : lastOriginalAudioVolumeRef.current;
      setSoundStartOffset(initialSoundStartAtVideoSeconds);
    });
    return () => cancelAnimationFrame(frameId);
  }, [initialSoundMuted, initialSoundVolume, initialOriginalAudioVolume, initialSoundStartAtVideoSeconds, isOpen]);

  useEffect(() => {
    if (!isOpen || !localSelectedSound || localSelectedSound.id !== selectedSound?.id) return;
    const duration = localSelectedSound.durationSeconds || 0;
    const frameId = requestAnimationFrame(() => {
      if (duration <= 0) {
        setSoundTrimStartPercent(0);
        setSoundTrimEndPercent(100);
        return;
      }
      const nextStart = Math.min(99, Math.max(0, (initialSoundTrimStartSeconds / duration) * 100));
      const nextEnd = initialSoundTrimEndSeconds > 0
        ? Math.min(100, Math.max(nextStart + 1, (initialSoundTrimEndSeconds / duration) * 100))
        : 100;
      setSoundTrimStartPercent(nextStart);
      setSoundTrimEndPercent(nextEnd);
    });
    return () => cancelAnimationFrame(frameId);
  }, [initialSoundTrimEndSeconds, initialSoundTrimStartSeconds, isOpen, localSelectedSound, selectedSound?.id]);

  useEffect(() => {
    if (timelineAudioRef.current) {
      timelineAudioRef.current.volume = soundMuted ? 0 : Math.min(1, soundVolume / 100);
    }
  }, [soundMuted, soundVolume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted || originalAudioVolume <= 0;
      videoRef.current.volume = Math.min(1, Math.max(0, originalAudioVolume) / 100);
    }
  }, [isVideoMuted, originalAudioVolume]);

  const { data, isLoading } = useSounds(
    {
      keyword: debouncedKeyword || undefined,
      type: activeTab === 'unlimited' ? 'OFFICIAL' : undefined,
      size: 30,
    },
    isOpen && activeTool === 'sound' && activeTab !== 'recent',
  );

  const sounds = useMemo(() => {
    const baseSounds = activeTab === 'recent' ? (selectedSound ? [selectedSound] : []) : data?.data ?? [];
    if (durationFilter === 'under60') return baseSounds.filter((sound) => sound.durationSeconds < 60);
    if (durationFilter === 'over60') return baseSounds.filter((sound) => sound.durationSeconds >= 60);
    return baseSounds;
  }, [activeTab, data?.data, durationFilter, selectedSound]);

  useEffect(() => {
    if (isOpen) return;
    audioRef.current?.pause();
    const frameId = requestAnimationFrame(() => {
      setPreviewingSoundId(null);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const frameId = requestAnimationFrame(() => setActiveTool(initialTool));
    return () => cancelAnimationFrame(frameId);
  }, [initialTool, isOpen]);

  useEffect(() => {
    if (isOpen && initialTool === 'sound') {
      const frameId = requestAnimationFrame(() => setRightSoundPanelOpen(true));
      return () => cancelAnimationFrame(frameId);
    }
  }, [initialTool, isOpen]);

  useEffect(() => {
    const previewAudio = audioRef.current;
    const video = videoRef.current;
    const timelineAudio = timelineAudioRef.current;

    return () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
      previewAudio?.pause();
      video?.pause();
      timelineAudio?.pause();
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsVideoFullscreen(document.fullscreenElement === videoViewportRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const stopPreview = () => {
    audioRef.current?.pause();
    setPreviewingSoundId(null);
    setPreviewProgress(0);
    setPreviewCurrentTime(0);
  };

  const toggleSoundPreview = (sound: Sound) => {
    if (previewingSoundId === sound.id) {
      stopPreview();
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(sound.audioUrl);
    audioRef.current = audio;
    setPreviewingSoundId(sound.id);
    setPreviewProgress(0);

    audio.ontimeupdate = () => {
      if (!audio.duration) return;
      setPreviewCurrentTime(audio.currentTime);
      setPreviewProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
    };
    audio.onended = () => {
      setPreviewingSoundId(null);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
    };
    audio.play().catch(() => {
      setPreviewingSoundId(null);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
    });
  };

  const handleSelect = (sound: Sound) => {
    stopPreview();
    setLocalSelectedSound(sound);
    if (localSelectedSound?.id !== sound.id) {
      const currentVideoTrimLength =
        videoDuration > 0
          ? ((trimEndPercent - trimStartPercent) / 100) * videoDuration
          : 0;
      const targetSoundLength =
        currentVideoTrimLength > 0 ? currentVideoTrimLength : videoDuration;
      setSoundTrimStartPercent(0);
      setSoundTrimEndPercent(
        targetSoundLength > 0 && sound.durationSeconds > targetSoundLength
          ? Math.max(1, Math.min(100, (targetSoundLength / sound.durationSeconds) * 100))
          : 100,
      );
      setSoundStartOffset(0);
    }
  };

  const selectedSoundDuration = Math.max(0, localSelectedSound?.durationSeconds ?? 0);
  const timelineDuration = Math.max(1, videoDuration, selectedSoundDuration);
  const trimStartSeconds = (trimStartPercent / 100) * videoDuration;
  const trimEndSeconds = (trimEndPercent / 100) * videoDuration;
  const trimLengthSeconds = Math.max(0, trimEndSeconds - trimStartSeconds);
  const timelineSpanSeconds = Math.max(timelineDuration, visibleTimelineSeconds);
  const timelineContentWidth = `${Math.max(100, (timelineDuration / visibleTimelineSeconds) * 100)}%`;
  const videoTrackWidth = `${Math.min(100, (videoDuration / timelineSpanSeconds) * 100)}%`;
  const soundTrackWidth = `${Math.min(100, (selectedSoundDuration / timelineSpanSeconds) * 100)}%`;
  const playheadPercent = `${Math.min(100, Math.max(0, (timelineCurrentTime / timelineSpanSeconds) * 100))}%`;
  const majorTickSeconds = visibleTimelineSeconds <= 5 ? 1 : visibleTimelineSeconds <= 15 ? 5 : visibleTimelineSeconds <= 60 ? 10 : 20;
  const minorTickSeconds = Math.max(1, majorTickSeconds / 2);
  const timelineMajorTicks = Array.from(
    { length: Math.floor(timelineSpanSeconds / majorTickSeconds) + 1 },
    (_, index) => index * majorTickSeconds,
  );
  const timelineMinorTicks = Array.from(
    { length: Math.floor(timelineSpanSeconds / minorTickSeconds) + 1 },
    (_, index) => index * minorTickSeconds,
  ).filter((second) => second % majorTickSeconds !== 0);
  const soundTrimStartSeconds = (soundTrimStartPercent / 100) * selectedSoundDuration;
  const soundTrimEndSeconds = (soundTrimEndPercent / 100) * selectedSoundDuration;
  const soundTrimLengthSeconds = Math.max(0, soundTrimEndSeconds - soundTrimStartSeconds);
  const timelinePlaybackEndSeconds = Math.max(
    trimEndSeconds || videoDuration,
    localSelectedSound ? soundStartOffset + soundTrimLengthSeconds : 0,
    videoDuration,
  );
  const safeTimelinePlaybackEndSeconds = Math.max(0, timelinePlaybackEndSeconds);

  const pauseVideoInternally = () => {
    const video = videoRef.current;
    if (!video || video.paused) return;
    internalMediaPauseRef.current = true;
    video.pause();
    internalMediaPauseRef.current = false;
  };

  const pauseAudioInternally = () => {
    const audio = timelineAudioRef.current;
    if (!audio || audio.paused) return;
    audio.pause();
  };

  const cancelTimelinePlayback = () => {
    if (playbackFrameRef.current !== null) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }
  };

  const syncTimelineMedia = (time: number) => {
    const video = videoRef.current;
    const audio = timelineAudioRef.current;
    const videoPlayable =
      video &&
      videoDuration > 0 &&
      time >= trimStartSeconds &&
      time < Math.min(trimEndSeconds, videoDuration);

    if (video && videoDuration > 0) {
      const targetVideoTime = Math.min(videoDuration, Math.max(0, time));
      if (Math.abs(video.currentTime - targetVideoTime) > 0.25) {
        video.currentTime = targetVideoTime;
      }
      setVideoCurrentTime(targetVideoTime);

      if (videoPlayable) {
        if (video.paused) {
          void video.play().catch(() => {});
        }
      } else {
        pauseVideoInternally();
      }
    }

    if (audio && localSelectedSound) {
      const soundStart = soundStartOffset;
      const soundEnd = soundStartOffset + soundTrimLengthSeconds;
      const audioPlayable = time >= soundStart && time < soundEnd;

      if (audioPlayable) {
        const targetAudioTime = Math.min(
          selectedSoundDuration,
          soundTrimStartSeconds + (time - soundStart),
        );
        if (Math.abs(audio.currentTime - targetAudioTime) > 0.25) {
          audio.currentTime = targetAudioTime;
        }
        if (audio.paused) {
          void audio.play().catch(() => {});
        }
      } else {
        pauseAudioInternally();
      }
    } else {
      pauseAudioInternally();
    }
  };

  const stopTimelinePlayback = () => {
    cancelTimelinePlayback();
    pauseVideoInternally();
    pauseAudioInternally();
    setIsVideoPlaying(false);
  };

  const runTimelinePlayback = (timestamp: number) => {
    if (playbackStartedAtRef.current === 0) {
      playbackStartedAtRef.current = timestamp;
    }
    const elapsedSeconds = (timestamp - playbackStartedAtRef.current) / 1000;
    const nextTime = Math.min(
      safeTimelinePlaybackEndSeconds,
      playbackStartTimeRef.current + elapsedSeconds,
    );

    setTimelineCurrentTime(nextTime);
    timelineCurrentTimeRef.current = nextTime;
    syncTimelineMedia(nextTime);

    if (nextTime >= safeTimelinePlaybackEndSeconds) {
      stopTimelinePlayback();
      return;
    }

    playbackFrameRef.current = requestAnimationFrame(runTimelinePlayback);
  };

  const startTimelinePlaybackAt = (time: number) => {
    if (safeTimelinePlaybackEndSeconds <= 0) return;
    const nextTime =
      time >= safeTimelinePlaybackEndSeconds
        ? Math.max(0, Math.min(trimStartSeconds, safeTimelinePlaybackEndSeconds))
        : Math.max(0, time);

    playbackStartTimeRef.current = nextTime;
    playbackStartedAtRef.current = 0;
    setTimelineCurrentTime(nextTime);
    timelineCurrentTimeRef.current = nextTime;
    setIsVideoPlaying(true);
    syncTimelineMedia(nextTime);
    cancelTimelinePlayback();
    playbackFrameRef.current = requestAnimationFrame(runTimelinePlayback);
  };

  const toggleVideoPlayback = () => {
    if (isVideoPlaying) {
      stopTimelinePlayback();
      return;
    }

    const playableTrimStart = Math.min(trimStartSeconds, Math.max(videoDuration - 0.1, 0));
    const currentTime =
      timelineCurrentTime >= safeTimelinePlaybackEndSeconds
        ? playableTrimStart
        : Math.max(0, timelineCurrentTime);

    startTimelinePlaybackAt(currentTime);
  };

  const toggleVideoMute = () => {
    const nextMuted = !isVideoMuted && originalAudioVolume > 0;
    const nextVolume = originalAudioVolume > 0 ? originalAudioVolume : lastOriginalAudioVolumeRef.current;

    if (!nextMuted && originalAudioVolume <= 0) {
      setOriginalAudioVolume(nextVolume);
    }
    setIsVideoMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = Math.min(1, nextVolume / 100);
    }
  };

  const toggleSoundMute = () => {
    const nextMuted = !soundMuted && soundVolume > 0;
    const nextVolume = soundVolume > 0 ? soundVolume : lastSoundVolumeRef.current;
    const keepVideoMuted = isVideoMuted || originalAudioVolume <= 0;

    if (!nextMuted && soundVolume <= 0) {
      setSoundVolume(nextVolume);
    }
    setSoundMuted(nextMuted);
    if (timelineAudioRef.current) {
      timelineAudioRef.current.volume = nextMuted ? 0 : Math.min(1, nextVolume / 100);
    }
    if (videoRef.current) {
      videoRef.current.muted = keepVideoMuted;
      videoRef.current.volume = keepVideoMuted ? 0 : Math.min(1, originalAudioVolume / 100);
    }
    onSoundMutedChange?.(nextMuted);
  };

  const toggleVideoFullscreen = async () => {
    const viewport = videoViewportRef.current;
    if (!viewport) return;

    try {
      if (document.fullscreenElement === viewport) {
        await document.exitFullscreen();
      } else {
        await viewport.requestFullscreen();
      }
    } catch {
      setIsVideoFullscreen(false);
    }
  };

  const updateTrimStart = (value: number) => {
    const next = Math.max(0, Math.min(value, trimEndPercent - 1));
    setTrimStartPercent(next);
  };

  const updateTrimEnd = (value: number) => {
    const next = Math.min(100, Math.max(value, trimStartPercent + 1));
    setTrimEndPercent(next);
  };

  const updateSoundTrimStart = (value: number) => {
    const next = Math.max(0, Math.min(value, soundTrimEndPercent - 1));
    setSoundTrimStartPercent(next);
  };

  const updateSoundTrimEnd = (value: number) => {
    const next = Math.min(100, Math.max(value, soundTrimStartPercent + 1));
    setSoundTrimEndPercent(next);
  };

  const updateTimelineZoom = (direction: 'in' | 'out') => {
    setVisibleTimelineSeconds((current) => {
      const next = direction === 'in' ? current / 1.5 : current * 1.5;
      return Math.min(120, Math.max(1, next));
    });
  };

  const handleTimelineWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    updateTimelineZoom(event.deltaY < 0 ? 'in' : 'out');
  };

  const getTimelinePercent = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    let percent = ((clientX - rect.left) / rect.width) * 100;
    if (percent < 2) percent = 0;
    if (percent > 98) percent = 100;
    return Math.min(100, Math.max(0, percent));
  };

  const beginTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const percent = getTimelinePercent(event.clientX);
    if (target === 'start') {
      updateTrimStart(percent);
      const video = videoRef.current;
      if (video && videoDuration > 0) {
        video.currentTime = Math.min(videoDuration, (Math.max(0, Math.min(percent, trimEndPercent - 1)) / 100) * videoDuration);
        setVideoCurrentTime(video.currentTime);
      }
    } else {
      updateTrimEnd(percent);
      const video = videoRef.current;
      if (video && videoDuration > 0) {
        video.currentTime = Math.min(videoDuration, (Math.min(100, Math.max(percent, trimStartPercent + 1)) / 100) * videoDuration);
        setVideoCurrentTime(video.currentTime);
      }
    }
  };

  const getSoundTimelinePercent = (clientX: number) => {
    const rect = soundTimelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    let percent = ((clientX - rect.left) / rect.width) * 100;
    if (percent < 2) percent = 0;
    if (percent > 98) percent = 100;
    return Math.min(100, Math.max(0, percent));
  };

  const beginSoundTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const percent = getSoundTimelinePercent(event.clientX);
    if (target === 'start') {
      updateSoundTrimStart(percent);
    } else {
      updateSoundTrimEnd(percent);
    }
  };

  const updateSoundTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const percent = getSoundTimelinePercent(event.clientX);
    if (target === 'start') {
      updateSoundTrimStart(percent);
    } else {
      updateSoundTrimEnd(percent);
    }
  };

  const updateTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const percent = getTimelinePercent(event.clientX);
    if (target === 'start') {
      updateTrimStart(percent);
      const video = videoRef.current;
      if (video && videoDuration > 0) {
        video.currentTime = Math.min(videoDuration, (Math.max(0, Math.min(percent, trimEndPercent - 1)) / 100) * videoDuration);
        setVideoCurrentTime(video.currentTime);
      }
    } else {
      updateTrimEnd(percent);
      const video = videoRef.current;
      if (video && videoDuration > 0) {
        video.currentTime = Math.min(videoDuration, (Math.min(100, Math.max(percent, trimStartPercent + 1)) / 100) * videoDuration);
        setVideoCurrentTime(video.currentTime);
      }
    }
  };



  const seekPreviewToTimelinePoint = (clientX: number) => {
    const rect = timelineContentRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || videoDuration <= 0) return;
    const seconds = Math.min(timelineSpanSeconds, Math.max(0, ((clientX - rect.left) / rect.width) * timelineSpanSeconds));
    const video = videoRef.current;
    const nextTime = Math.min(safeTimelinePlaybackEndSeconds || timelineSpanSeconds, Math.max(0, seconds));
    if (isVideoPlaying) {
      playbackStartTimeRef.current = nextTime;
      playbackStartedAtRef.current = 0;
    }
    setTimelineCurrentTime(nextTime);
    timelineCurrentTimeRef.current = nextTime;
    if (!video) return;
    const nextVideoTime = Math.min(videoDuration, Math.max(0, nextTime));
    video.currentTime = nextVideoTime;
    setVideoCurrentTime(nextVideoTime);
    syncTimelineMedia(nextTime);
  };

  const beginSharedPlayheadDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resumeAfterPlayheadDragRef.current = isVideoPlaying;
    if (isVideoPlaying) {
      stopTimelinePlayback();
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    seekPreviewToTimelinePoint(event.clientX);
  };

  const updateSharedPlayheadDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    seekPreviewToTimelinePoint(event.clientX);
  };

  const endSharedPlayheadDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (resumeAfterPlayheadDragRef.current) {
      resumeAfterPlayheadDragRef.current = false;
      startTimelinePlaybackAt(timelineCurrentTimeRef.current);
      return;
    }

    resumeAfterPlayheadDragRef.current = false;
  };

  const hasChanges = () => {
    if (localSelectedSound?.id !== selectedSound?.id) return true;
    const currentStartSec = (trimStartPercent / 100) * videoDuration;
    const currentEndSec = (trimEndPercent / 100) * videoDuration;
    if (Math.abs(currentStartSec - initialTrimStartSeconds) > 0.1) return true;
    const initEnd = initialTrimEndSeconds > 0 ? initialTrimEndSeconds : videoDuration;
    if (Math.abs(currentEndSec - initEnd) > 0.1) return true;
    if (effectiveOriginalAudioVolume !== initialOriginalAudioVolume) return true;
    if (Math.abs(soundStartOffset - initialSoundStartAtVideoSeconds) > 0.1) return true;
    if (localSelectedSound) {
      const currentSoundStartSec = (soundTrimStartPercent / 100) * selectedSoundDuration;
      const currentSoundEndSec = (soundTrimEndPercent / 100) * selectedSoundDuration;
      const initSoundEnd = initialSoundTrimEndSeconds > 0 ? initialSoundTrimEndSeconds : selectedSoundDuration;
      if (Math.abs(currentSoundStartSec - initialSoundTrimStartSeconds) > 0.1) return true;
      if (Math.abs(currentSoundEndSec - initSoundEnd) > 0.1) return true;
      if (soundVolume !== initialSoundVolume) return true;
      if (soundMuted !== initialSoundMuted) return true;
    }
    return false;
  };

  const handleCancelClick = () => {
    if (hasChanges()) {
      setShowCancelModal(true);
    } else {
      onClose();
    }
  };

  const handleSaveClick = () => {
    if (videoDuration > 0) {
      onTrimChange?.({
        startSeconds: (trimStartPercent / 100) * videoDuration,
        endSeconds: (trimEndPercent / 100) * videoDuration,
      });
    }
    onOriginalAudioVolumeChange?.(effectiveOriginalAudioVolume);
    onSoundStartAtVideoSecondsChange?.(soundStartOffset);
    if (localSelectedSound && selectedSoundDuration > 0) {
      onSoundTrimChange?.({
        startSeconds: (soundTrimStartPercent / 100) * selectedSoundDuration,
        endSeconds: (soundTrimEndPercent / 100) * selectedSoundDuration,
      });
      onSoundVolumeChange?.(soundVolume);
      onSoundMutedChange?.(soundMuted);
    }
    onSelectSound(localSelectedSound);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-background text-text-primary">
      <aside className="absolute inset-y-0 left-0 z-50 hidden w-[72px] flex-shrink-0 flex-col items-center border-r border-elevated bg-background py-4 lg:flex">
        <Logo size="sm" className="mb-6" />
        {showTextTool ? (
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`mb-3 flex w-[52px] flex-col items-center gap-1 rounded-lg px-1.5 py-2 transition-colors ${
              activeTool === 'text'
                ? 'border border-elevated bg-elevated/50 text-text-primary'
                : 'text-text-secondary hover:bg-hover'
            }`}
          >
            <Type size={19} />
            <span className={`text-[11px] ${activeTool === 'text' ? 'font-semibold' : ''}`}>{t('textTool')}</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setActiveTool(activeTool === 'sound' ? 'edit' : 'sound')}
          className={`flex w-[52px] flex-col items-center gap-1 rounded-lg px-1.5 py-2 transition-colors ${
            activeTool === 'sound'
              ? 'border border-elevated bg-elevated/50 text-text-primary'
              : 'text-text-secondary hover:bg-hover'
          }`}
        >
          <Music size={19} />
          <span className={`text-[11px] ${activeTool === 'sound' ? 'font-semibold' : ''}`}>{t('soundTool')}</span>
        </button>
      </aside>

      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-elevated bg-background px-4 lg:ml-[72px]">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="grid size-8 place-items-center rounded-lg border border-elevated text-text-primary transition-colors hover:bg-hover"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="truncate text-sm font-bold">{description?.trim() || t('editorTitle')}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={handleCancelClick} className="rounded-md bg-elevated px-5 py-1.5 text-sm font-semibold hover:bg-hover">
            {t('cancel')}
          </button>
          <button type="button" onClick={handleSaveClick} className="rounded-md bg-brand px-6 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
            {t('save')}
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex flex-1 lg:pl-[84px]">
        <section className={`absolute bottom-[270px] left-0 top-0 z-20 w-full min-w-0 flex-col border-r border-elevated bg-background shadow-2xl md:w-[340px] lg:left-[72px] ${activeTool === 'sound' ? 'flex' : 'hidden'}`}>
          <div className="flex items-center justify-between border-b border-elevated px-4 py-3">
            <h3 className="text-base font-bold">{t('title')}</h3>
            <button type="button" onClick={() => setActiveTool('edit')} className="grid size-8 place-items-center rounded-full hover:bg-hover">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3">
            <div className="flex gap-2">
              <label className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-elevated/70 px-3">
                <Search size={16} className="text-text-muted" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                />
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                  className={`grid size-9 place-items-center rounded-lg bg-elevated/70 hover:bg-hover ${durationFilter !== 'all' ? 'text-brand' : ''}`}
                >
                  <ListFilter size={17} />
                </button>
                {filterOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-lg border border-elevated bg-background py-1 shadow-xl">
                    {(['all', 'under60', 'over60'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setDurationFilter(filter);
                          setFilterOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-hover ${
                          durationFilter === filter ? 'font-semibold text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {t(filter)}
                        {durationFilter === filter ? <Check size={14} /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex gap-5 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    stopPreview();
                    setActiveTab(tab);
                  }}
                  className={`whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-text-primary font-semibold text-text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {isLoading ? (
              <div className="px-2 py-10 text-center text-sm text-text-muted">{t('loading')}</div>
            ) : sounds.length === 0 ? (
              <div className="px-2 py-10 text-center text-sm text-text-muted">{t('noResults')}</div>
            ) : (
              <div className="space-y-1.5">
                {sounds.map((sound) => {
                  const selected = localSelectedSound?.id === sound.id;
                  const previewing = previewingSoundId === sound.id;
                  return (
                    <div
                      key={sound.id}
                      className={`rounded-xl px-2 py-2 transition-colors ${selected || previewing ? 'bg-elevated/70' : 'hover:bg-hover'}`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => toggleSoundPreview(sound)}
                          className="group relative size-12 flex-shrink-0 overflow-hidden rounded-lg bg-elevated"
                        >
                          {sound.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={sound.coverUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="grid size-full place-items-center bg-zinc-900 text-white">
                              <Music size={24} />
                            </div>
                          )}
                          <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                            {previewing ? <Pause size={18} className="text-white" fill="white" /> : <Play size={18} className="text-white" fill="white" />}
                          </span>
                        </button>
                        <button type="button" onClick={() => toggleSoundPreview(sound)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold">{sound.title}</p>
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            {formatDuration(sound.durationSeconds)}
                            {getSoundArtist(sound) ? ` · ${getSoundArtist(sound)}` : ''}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelect(sound)}
                          className={`grid size-9 flex-shrink-0 place-items-center rounded-full text-white transition-colors ${
                            selected ? 'bg-text-primary' : 'bg-brand hover:bg-brand-dark'
                          }`}
                          aria-label={selected ? t('selected') : localSelectedSound ? 'Thay thế âm thanh' : t('add')}
                          title={selected ? t('selected') : localSelectedSound ? 'Thay thế âm thanh' : t('add')}
                        >
                          {selected ? <Check size={18} /> : localSelectedSound ? <RefreshCw size={17} /> : <Plus size={20} />}
                        </button>
                      </div>
                      {previewing ? (
                        <div className="mt-3 flex items-center gap-2 pl-[74px] pr-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                            <div className="h-full bg-text-primary" style={{ width: `${previewProgress}%` }} />
                          </div>
                          <span className="text-xs text-text-muted">{formatDuration(previewCurrentTime)}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 items-center justify-center p-8">
              <div
                ref={videoViewportRef}
                className={`relative flex items-center justify-center overflow-hidden rounded-sm bg-black shadow-sm ${
                  isVideoFullscreen
                    ? 'h-screen max-h-none w-screen max-w-none'
                    : 'h-full max-h-[68vh] w-full max-w-5xl'
                }`}
              >
                {previewUrl ? (
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    muted={isVideoMuted || originalAudioVolume <= 0}
                    playsInline
                    className="h-full w-full object-contain"
                    onLoadedMetadata={(event) => {
                      const duration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
                      setVideoDuration(duration);
                      const nextStartPercent = duration > 0 ? Math.min(99, Math.max(0, (initialTrimStartSeconds / duration) * 100)) : 0;
                      const defaultEndSeconds = initialTrimEndSeconds > 0 ? initialTrimEndSeconds : duration;
                      const nextEndPercent = duration > 0 ? Math.min(100, Math.max(nextStartPercent + 1, (defaultEndSeconds / duration) * 100)) : 100;
                      setTrimStartPercent(nextStartPercent);
                      setTrimEndPercent(nextEndPercent);
                    }}
                    onTimeUpdate={(event) => {
                      const video = event.currentTarget;
                      setVideoCurrentTime(video.currentTime);

                      if (isVideoPlaying) return;
                      
                      if (timelineAudioRef.current && localSelectedSound) {
                        const inSoundRange = video.currentTime >= soundStartOffset && video.currentTime < soundStartOffset + soundTrimLengthSeconds;
                        if (inSoundRange && !video.paused) {
                          const expectedAudioTime = soundTrimStartSeconds + (video.currentTime - soundStartOffset);
                          if (Math.abs(timelineAudioRef.current.currentTime - expectedAudioTime) > 0.25) {
                            timelineAudioRef.current.currentTime = expectedAudioTime;
                          }
                          if (timelineAudioRef.current.paused) {
                            void timelineAudioRef.current.play().catch(() => {});
                          }
                        } else if ((!inSoundRange || video.paused) && !timelineAudioRef.current.paused) {
                          timelineAudioRef.current.pause();
                        }
                      }

                      const playableTrimEnd = Math.min(trimEndSeconds, videoDuration);
                      if (videoDuration > 0 && video.currentTime >= playableTrimEnd) {
                        video.pause();
                        if (timelineAudioRef.current) timelineAudioRef.current.pause();
                        video.currentTime = Math.min(trimStartSeconds, Math.max(videoDuration - 0.1, 0));
                        setIsVideoPlaying(false);
                      }
                    }}
                    onPause={() => {
                      if (!internalMediaPauseRef.current) {
                        stopTimelinePlayback();
                      }
                      if (timelineAudioRef.current) timelineAudioRef.current.pause();
                    }}
                    onPlay={() => {
                      if (!isVideoPlaying) setIsVideoPlaying(true);
                    }}
                  />
                ) : null}
                {localSelectedSound?.audioUrl ? (
                  <audio
                    ref={timelineAudioRef}
                    src={localSelectedSound.audioUrl}
                    preload="auto"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={toggleVideoFullscreen}
                  className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-lg border border-elevated bg-background/90 text-text-primary shadow backdrop-blur hover:bg-hover"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>

            {activeTool === 'sound' && rightSoundPanelOpen ? (
              <aside className="hidden h-full min-h-0 w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-elevated bg-background xl:flex">
                <div className="flex h-14 items-center justify-between border-b border-elevated px-5">
                  <h3 className="text-base font-bold text-text-primary">Âm thanh</h3>
                  <button
                    type="button"
                    onClick={() => setRightSoundPanelOpen(false)}
                    className="grid size-8 place-items-center rounded-full text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                    aria-label="Đóng bảng âm thanh"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {localSelectedSound ? (
                    <div className="space-y-5">
                      <div>
                        <p className="truncate text-sm font-bold text-text-primary">{localSelectedSound.title}</p>
                        <p className="mt-1 truncate text-xs text-text-muted">
                          {formatDuration(localSelectedSound.durationSeconds)}
                          {getSoundArtist(localSelectedSound) ? ` · ${getSoundArtist(localSelectedSound)}` : ''}
                        </p>
                      </div>

                      <div className="space-y-6 border-t border-elevated pt-5">
                        <div>
                          <div className="mb-4">
                            <span className="text-sm font-semibold text-text-primary">Âm lượng</span>
                          </div>

                          {/* Original audio volume */}
                          <div className="mb-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="block text-xs text-text-muted">Video gốc</span>
                              <button
                                type="button"
                                onClick={() => applyOriginalAudioVolume(initialOriginalAudioVolume)}
                                className="grid size-7 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                                aria-label="Đặt lại âm lượng video gốc"
                                title="Đặt lại âm lượng video gốc"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={toggleVideoMute}
                                className="grid size-8 flex-shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                                aria-label={effectiveOriginalAudioVolume <= 0 ? 'Bật âm thanh gốc' : 'Tắt âm thanh gốc'}
                              >
                                {effectiveOriginalAudioVolume <= 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={effectiveOriginalAudioVolume}
                                onChange={(event) => applyOriginalAudioVolume(Number(event.target.value))}
                                className="min-w-0 flex-1 accent-cyan"
                                aria-label="Âm lượng video gốc"
                              />
                              <span className="w-14 rounded-lg bg-elevated px-2 py-2 text-center text-sm font-semibold text-text-primary">
                                {effectiveOriginalAudioVolume}
                              </span>
                            </div>
                          </div>

                          {/* Sound volume */}
                          <div className="mb-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="block text-xs text-text-muted">Nhạc nền</span>
                              <button
                                type="button"
                                onClick={() => applySoundVolume(initialSoundVolume)}
                                className="grid size-7 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                                aria-label="Đặt lại âm lượng nhạc"
                                title="Đặt lại âm lượng nhạc"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={toggleSoundMute}
                                className="grid size-8 flex-shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                                aria-label={effectiveSoundVolume <= 0 ? 'Bật âm thanh nhạc' : 'Tắt âm thanh nhạc'}
                              >
                                {effectiveSoundVolume <= 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={effectiveSoundVolume}
                                onChange={(event) => applySoundVolume(Number(event.target.value))}
                                className="min-w-0 flex-1 accent-brand"
                                aria-label="Âm lượng nhạc"
                              />
                              <span className="w-14 rounded-lg bg-elevated px-2 py-2 text-center text-sm font-semibold text-text-primary">
                                {effectiveSoundVolume}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sound start offset in video */}
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-primary">Nhạc bắt đầu tại</span>
                            <span className="text-xs font-semibold text-text-muted">{formatDuration(soundStartOffset)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min={0}
                              max={Math.max(1, Math.floor(trimLengthSeconds || videoDuration))}
                              step={0.5}
                              value={soundStartOffset}
                              onChange={(event) => setSoundStartOffset(Number(event.target.value))}
                              className="min-w-0 flex-1 accent-brand"
                              aria-label="Thời điểm nhạc bắt đầu trong video"
                            />
                            <span className="w-20 rounded-lg bg-elevated px-3 py-2 text-center text-sm font-semibold text-text-primary">
                              {soundStartOffset.toFixed(1)} s
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-text-muted">Chọn thời điểm nhạc nền bắt đầu phát trong video.</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-elevated bg-surface/30 p-4">
                        <p className="text-sm font-bold text-text-primary">Đoạn nhạc</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg bg-background p-3">
                            <p className="text-xs font-semibold text-text-muted">Bắt đầu</p>
                            <p className="mt-1 font-bold text-text-primary">{formatDuration(soundTrimStartSeconds)}</p>
                          </div>
                          <div className="rounded-lg bg-background p-3">
                            <p className="text-xs font-semibold text-text-muted">Kết thúc</p>
                            <p className="mt-1 font-bold text-text-primary">{formatDuration(soundTrimEndSeconds || selectedSoundDuration)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTool('sound')}
                          className="grid size-10 place-items-center rounded-lg border border-elevated text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                          aria-label="Đổi âm thanh"
                          title="Đổi âm thanh"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopPreview();
                            setLocalSelectedSound(null);
                            setSoundTrimStartPercent(0);
                            setSoundTrimEndPercent(100);
                          }}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-elevated text-sm font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                        >
                          <X size={16} />
                          Gỡ âm thanh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-elevated p-6 text-center">
                      <Music size={40} className="text-text-muted" />
                      <p className="mt-3 text-sm font-bold text-text-primary">Chưa chọn nhạc</p>
                      <p className="mt-1 text-xs text-text-muted">Chọn một âm thanh ở danh sách bên trái để chỉnh thời lượng và âm lượng.</p>
                    </div>
                  )}
                </div>
              </aside>
            ) : null}

            {activeTool === 'sound' ? (
              <div className="hidden w-[72px] flex-shrink-0 items-start justify-center border-l border-elevated bg-background pt-3 xl:flex">
                <button
                  type="button"
                  onClick={() => setRightSoundPanelOpen((open) => !open)}
                  className={`flex w-[56px] flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2.5 transition-colors hover:bg-hover ${
                    rightSoundPanelOpen
                      ? 'border-elevated bg-elevated/50 text-text-primary'
                      : 'border-elevated bg-elevated/30 text-text-primary'
                  }`}
                  aria-pressed={rightSoundPanelOpen}
                  aria-label={rightSoundPanelOpen ? 'Ẩn bảng âm thanh' : 'Mở bảng âm thanh'}
                >
                  <Music size={22} />
                  <span className="text-[12px] font-semibold">Âm thanh</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative z-30 h-[270px] flex-shrink-0 border-t border-elevated bg-background">
            <div className="flex h-12 items-center justify-between border-b border-elevated px-5">
              <div className="flex items-center gap-5">
                <Film size={20} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={toggleVideoPlayback} className="grid size-8 place-items-center rounded-full hover:bg-hover">
                  {isVideoPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <span className="text-sm font-semibold">{formatDuration(timelineCurrentTime)}</span>
                <span className="text-sm text-text-muted">/ {formatDuration(safeTimelinePlaybackEndSeconds || videoDuration)}</span>
                <div className="ml-8 flex items-center gap-2 border-l border-elevated pl-4">
                  <button
                    type="button"
                    onClick={() => updateTimelineZoom('out')}
                    disabled={visibleTimelineSeconds >= 120}
                    className="grid size-7 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Thu nhỏ timeline"
                    title="Thu nhỏ timeline"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-text-primary transition-all"
                      style={{ width: `${((120 - visibleTimelineSeconds) / 119) * 100}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTimelineZoom('in')}
                    disabled={visibleTimelineSeconds <= 1}
                    className="grid size-7 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Phóng to timeline"
                    title="Phóng to timeline"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="relative h-[222px] overflow-hidden px-12 py-3 pb-8">
              <div className="grid h-full min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-x-5">
                <div className="grid grid-rows-[28px_56px_40px] gap-y-3">
                  <div />
                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className="grid size-8 place-self-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                    aria-label={effectiveOriginalAudioVolume <= 0 ? t('unmute') : t('mute')}
                  >
                    {effectiveOriginalAudioVolume <= 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  {localSelectedSound ? (
                    <button
                      type="button"
                      onClick={toggleSoundMute}
                      className="grid size-8 place-self-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                      aria-label={effectiveSoundVolume <= 0 ? 'Bật âm thanh nhạc' : 'Tắt âm thanh nhạc'}
                    >
                      {effectiveSoundVolume <= 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="min-w-0 overflow-x-auto overflow-y-visible pb-2" onWheel={handleTimelineWheel}>
                  <div
                    ref={timelineContentRef}
                    className="relative grid min-w-full grid-rows-[28px_56px_40px] gap-y-3"
                    style={{ width: timelineContentWidth }}
                  >
                    <div className="relative border-b border-elevated">
                      {timelineMinorTicks.map((second) => (
                        <span
                          key={`minor-${second}`}
                          className="absolute bottom-0 h-2 w-px bg-elevated"
                          style={{ left: `${(second / timelineSpanSeconds) * 100}%` }}
                        />
                      ))}
                      {timelineMajorTicks.map((second) => (
                        <span
                          key={`major-${second}`}
                          className="absolute bottom-0 flex h-6 -translate-x-px flex-col justify-end text-[10px] font-medium text-text-muted"
                          style={{ left: `${(second / timelineSpanSeconds) * 100}%` }}
                        >
                          <span className="mb-1 h-3 w-px bg-elevated" />
                          <span className="translate-x-1">{formatDuration(second)}</span>
                        </span>
                      ))}
                    </div>

                    <div
                      onPointerDown={beginSharedPlayheadDrag}
                      onPointerMove={updateSharedPlayheadDrag}
                      onPointerUp={endSharedPlayheadDrag}
                      onPointerCancel={endSharedPlayheadDrag}
                      className="absolute bottom-0 top-0 z-50 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
                      style={{ left: playheadPercent }}
                    >
                      <div className="mx-auto h-full w-px bg-cyan" />
                      <div className="absolute left-1/2 top-7 h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-cyan" />
                    </div>

                    <div
                      ref={timelineRef}
                      className="relative max-w-full overflow-visible rounded-md bg-black"
                      style={{ width: videoTrackWidth }}
                    >
                      <div className="absolute inset-y-0 left-0 flex overflow-hidden rounded-md w-full">
                        {Array.from({ length: 10 }).map((_, index) => (
                          <div key={index} className="relative h-full flex-1 overflow-hidden border-r border-black/10 bg-zinc-900">
                            {previewUrl && videoDuration > 0 ? (
                              <video src={`${previewUrl}#t=${Math.max(0.1, (videoDuration / 10) * index)}`} muted preload="metadata" className="size-full object-cover opacity-80" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-2 top-2 z-20 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {formatDuration(videoDuration)}
                      </div>
                      <div className="absolute inset-y-0 bg-black/55" style={{ left: 0, width: `${trimStartPercent}%` }} />
                      <div className="absolute inset-y-0 bg-black/55" style={{ left: `${trimEndPercent}%`, right: 0 }} />
                      <div
                        className="absolute inset-y-0 rounded-md border border-cyan shadow-[0_0_0_2px_rgba(34,211,238,0.22)]"
                        style={{ left: `${trimStartPercent}%`, right: `${100 - trimEndPercent}%` }}
                      />
                      <div
                        role="slider"
                        tabIndex={0}
                        aria-label={t('trimStart')}
                        aria-valuemin={0}
                        aria-valuemax={Math.floor(trimEndPercent - 1)}
                        aria-valuenow={Math.floor(trimStartPercent)}
                        onPointerDown={(event) => beginTrimHandleDrag('start', event)}
                        onPointerMove={(event) => updateTrimHandleDrag('start', event)}
                        className="absolute top-0 z-40 h-14 w-3 -translate-x-1/2 cursor-ew-resize touch-none rounded-md border-2 border-cyan bg-cyan/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                        style={{ left: `${trimStartPercent}%` }}
                      />
                      <div
                        role="slider"
                        tabIndex={0}
                        aria-label={t('trimEnd')}
                        aria-valuemin={Math.ceil(trimStartPercent + 1)}
                        aria-valuemax={100}
                        aria-valuenow={Math.floor(trimEndPercent)}
                        onPointerDown={(event) => beginTrimHandleDrag('end', event)}
                        onPointerMove={(event) => updateTrimHandleDrag('end', event)}
                        className="absolute top-0 z-40 h-full w-2 -translate-x-1/2 cursor-ew-resize touch-none rounded-md border-2 border-cyan bg-cyan/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                        style={{ left: `${trimEndPercent}%` }}
                      />
                    </div>

                    {localSelectedSound ? (
                      <div
                        ref={soundTimelineRef}
                        className="relative max-w-full overflow-visible rounded-md bg-brand/15"
                        style={{ width: soundTrackWidth }}
                      >
                        <div className="absolute inset-0 overflow-hidden rounded-md bg-gradient-to-r from-brand/40 via-purple-500/35 to-cyan/35" />
                        <div className="absolute left-2 top-1/2 z-10 max-w-[45%] -translate-y-1/2 truncate text-xs font-semibold text-white drop-shadow">
                          ♪ {localSelectedSound.title}
                        </div>
                        <div className="absolute inset-y-0 bg-background/70" style={{ left: 0, width: `${soundTrimStartPercent}%` }} />
                        <div className="absolute inset-y-0 bg-background/70" style={{ left: `${soundTrimEndPercent}%`, right: 0 }} />
                        <div
                          className="absolute inset-y-0 rounded-md border border-brand shadow-[0_0_0_2px_rgba(254,44,85,0.18)]"
                          style={{ left: `${soundTrimStartPercent}%`, right: `${100 - soundTrimEndPercent}%` }}
                        />
                        <div
                          role="slider"
                          tabIndex={0}
                          aria-label="Cắt điểm bắt đầu âm thanh"
                          aria-valuemin={0}
                          aria-valuemax={Math.floor(soundTrimEndPercent - 1)}
                          aria-valuenow={Math.floor(soundTrimStartPercent)}
                          onPointerDown={(event) => beginSoundTrimHandleDrag('start', event)}
                          onPointerMove={(event) => updateSoundTrimHandleDrag('start', event)}
                          className="absolute top-0 z-40 h-10 w-3 -translate-x-1/2 cursor-ew-resize touch-none rounded-md border-2 border-brand bg-brand/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                          style={{ left: `${soundTrimStartPercent}%` }}
                        />
                        <div
                          role="slider"
                          tabIndex={0}
                          aria-label="Cắt điểm kết thúc âm thanh"
                          aria-valuemin={Math.ceil(soundTrimStartPercent + 1)}
                          aria-valuemax={100}
                          aria-valuenow={Math.floor(soundTrimEndPercent)}
                          onPointerDown={(event) => beginSoundTrimHandleDrag('end', event)}
                          onPointerMove={(event) => updateSoundTrimHandleDrag('end', event)}
                          className="absolute top-0 z-40 h-10 w-3 -translate-x-1/2 cursor-ew-resize touch-none rounded-md border-2 border-brand bg-brand/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                          style={{ left: `${soundTrimEndPercent}%` }}
                        />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4">
          <div className="modal-opacity-solid bg-background border border-elevated rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-text-primary mb-2">Huỷ chỉnh sửa?</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Bạn có những thay đổi chưa được lưu. Bạn có chắc chắn muốn huỷ bỏ các thay đổi này không?
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2 rounded-md font-semibold text-text-primary hover:bg-elevated transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  onClose();
                }}
                className="px-5 py-2 rounded-md font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
