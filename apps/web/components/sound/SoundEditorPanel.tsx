'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Film,
  ListFilter,
  Maximize,
  Music,
  Pause,
  Play,
  Plus,
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
import type { PointerEvent as ReactPointerEvent } from 'react';

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
  onSelectSound: (sound: Sound | null) => void;
  onTrimChange?: (trim: { startSeconds: number; endSeconds: number }) => void;
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
  onSelectSound,
  onTrimChange,
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
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [trimStartPercent, setTrimStartPercent] = useState(0);
  const [trimEndPercent, setTrimEndPercent] = useState(100);
  const [localSelectedSound, setLocalSelectedSound] = useState<Sound | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoViewportRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const frameId = requestAnimationFrame(() => setLocalSelectedSound(selectedSound || null));
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, selectedSound]);

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
    return () => {
      audioRef.current?.pause();
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
  };

  const trimStartSeconds = (trimStartPercent / 100) * videoDuration;
  const trimEndSeconds = (trimEndPercent / 100) * videoDuration;
  const trimLengthSeconds = Math.max(0, trimEndSeconds - trimStartSeconds);
  const playheadPercent = videoDuration > 0 ? Math.min(trimEndPercent, Math.max(trimStartPercent, (videoCurrentTime / videoDuration) * 100)) : 0;

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime < trimStartSeconds || video.currentTime >= trimEndSeconds) {
        video.currentTime = trimStartSeconds;
      }
      void video.play();
      setIsVideoPlaying(true);
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoMute = () => {
    const nextMuted = !isVideoMuted;
    setIsVideoMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
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

  const getTimelinePercent = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  };

  const beginTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const percent = getTimelinePercent(event.clientX);
    if (target === 'start') {
      updateTrimStart(percent);
    } else {
      updateTrimEnd(percent);
    }
  };

  const updateTrimHandleDrag = (target: 'start' | 'end', event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const percent = getTimelinePercent(event.clientX);
    if (target === 'start') {
      updateTrimStart(percent);
    } else {
      updateTrimEnd(percent);
    }
  };

  const seekPreviewToPercent = (percent: number) => {
    const video = videoRef.current;
    if (!video || videoDuration <= 0) return;
    const clampedPercent = Math.min(trimEndPercent, Math.max(trimStartPercent, percent));
    video.currentTime = (clampedPercent / 100) * videoDuration;
    setVideoCurrentTime(video.currentTime);
  };

  const beginPlayheadDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    seekPreviewToPercent(getTimelinePercent(event.clientX));
  };

  const updatePlayheadDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    seekPreviewToPercent(getTimelinePercent(event.clientX));
  };

  const hasChanges = () => {
    if (localSelectedSound?.id !== selectedSound?.id) return true;
    const currentStartSec = (trimStartPercent / 100) * videoDuration;
    const currentEndSec = (trimEndPercent / 100) * videoDuration;
    if (Math.abs(currentStartSec - initialTrimStartSeconds) > 0.1) return true;
    const initEnd = initialTrimEndSeconds > 0 ? initialTrimEndSeconds : videoDuration;
    if (Math.abs(currentEndSec - initEnd) > 0.1) return true;
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
    onSelectSound(localSelectedSound);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-background text-text-primary">
      <aside className="absolute inset-y-0 left-0 z-50 hidden w-[84px] flex-shrink-0 flex-col items-center border-r border-elevated bg-background py-5 lg:flex">
        <Logo size="sm" className="mb-6" />
        <button
          type="button"
          onClick={() => setActiveTool('text')}
          className={`mb-4 flex w-[58px] flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 transition-colors ${
            activeTool === 'text'
              ? 'border border-elevated bg-elevated/50 text-text-primary'
              : 'text-text-secondary hover:bg-hover'
          }`}
        >
          <Type size={21} />
          <span className={`text-[11px] ${activeTool === 'text' ? 'font-semibold' : ''}`}>{t('textTool')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTool(activeTool === 'sound' ? 'edit' : 'sound')}
          className={`flex w-[58px] flex-col items-center gap-1 rounded-lg px-1.5 py-2.5 transition-colors ${
            activeTool === 'sound'
              ? 'border border-elevated bg-elevated/50 text-text-primary'
              : 'text-text-secondary hover:bg-hover'
          }`}
        >
          <Music size={21} />
          <span className={`text-[11px] ${activeTool === 'sound' ? 'font-semibold' : ''}`}>{t('soundTool')}</span>
        </button>
      </aside>

      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-elevated bg-background px-5 lg:ml-[84px]">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="grid size-9 place-items-center rounded-lg border border-elevated text-text-primary transition-colors hover:bg-hover"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="truncate text-sm font-bold">{description?.trim() || t('editorTitle')}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={handleCancelClick} className="rounded-md bg-elevated px-6 py-2 text-sm font-semibold hover:bg-hover">
            {t('cancel')}
          </button>
          <button type="button" onClick={handleSaveClick} className="rounded-md bg-brand px-7 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            {t('save')}
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex flex-1 lg:pl-[84px]">
        <section className={`absolute inset-y-0 left-0 z-20 w-full min-w-0 flex-col border-r border-elevated bg-background shadow-2xl md:w-[395px] lg:left-[84px] ${activeTool === 'sound' ? 'flex' : 'hidden'}`}>
          <div className="flex items-center justify-between border-b border-elevated px-5 py-4">
            <h3 className="text-lg font-bold">{t('title')}</h3>
            <button type="button" onClick={() => setActiveTool('edit')} className="grid size-8 place-items-center rounded-full hover:bg-hover">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="flex gap-2">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg bg-elevated/70 px-3">
                <Search size={17} className="text-text-muted" />
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
                  className={`grid size-10 place-items-center rounded-lg bg-elevated/70 hover:bg-hover ${durationFilter !== 'all' ? 'text-brand' : ''}`}
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
              <div className="space-y-2">
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
                          className="group relative size-[58px] flex-shrink-0 overflow-hidden rounded-lg bg-elevated"
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
                          <p className="truncate text-base font-semibold">{sound.title}</p>
                          <p className="mt-1 truncate text-sm text-text-muted">
                            {formatDuration(sound.durationSeconds)}
                            {getSoundArtist(sound) ? ` · ${getSoundArtist(sound)}` : ''}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelect(sound)}
                          className={`grid size-10 flex-shrink-0 place-items-center rounded-full text-white transition-colors ${
                            selected ? 'bg-text-primary' : 'bg-brand hover:bg-brand-dark'
                          }`}
                          aria-label={selected ? t('selected') : t('add')}
                        >
                          {selected ? <Check size={18} /> : <Plus size={20} />}
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
          <div className="flex min-h-0 flex-1">
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
                    muted={isVideoMuted}
                    playsInline
                    className="max-h-full max-w-full object-contain"
                    onLoadedMetadata={(event) => {
                      const duration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
                      setVideoDuration(duration);
                      const nextStartPercent = duration > 0 ? Math.min(99, Math.max(0, (initialTrimStartSeconds / duration) * 100)) : 0;
                      const nextEndPercent = duration > 0 && initialTrimEndSeconds > 0 ? Math.min(100, Math.max(nextStartPercent + 1, (initialTrimEndSeconds / duration) * 100)) : 100;
                      setTrimStartPercent(nextStartPercent);
                      setTrimEndPercent(nextEndPercent);
                    }}
                    onTimeUpdate={(event) => {
                      const video = event.currentTarget;
                      setVideoCurrentTime(video.currentTime);
                      if (videoDuration > 0 && video.currentTime >= trimEndSeconds) {
                        video.pause();
                        video.currentTime = trimStartSeconds;
                        setIsVideoPlaying(false);
                      }
                    }}
                    onPause={() => setIsVideoPlaying(false)}
                    onPlay={() => setIsVideoPlaying(true)}
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

          </div>

          <div className="relative z-30 h-[296px] flex-shrink-0 border-t border-elevated bg-background">
            <div className="flex h-[58px] items-center justify-between border-b border-elevated px-6">
              <div className="flex items-center gap-5">
                <Film size={20} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={toggleVideoPlayback} className="grid size-8 place-items-center rounded-full hover:bg-hover">
                  {isVideoPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <span className="text-sm font-semibold">{formatDuration(videoCurrentTime)}</span>
                <span className="text-sm text-text-muted">/ {formatDuration(trimLengthSeconds || videoDuration)}</span>
              </div>
            </div>
            <div className="relative h-[238px] overflow-hidden px-16 py-10">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={toggleVideoMute}
                  className="grid size-8 flex-shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                  aria-label={isVideoMuted ? t('unmute') : t('mute')}
                >
                  {isVideoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div ref={timelineRef} className="relative h-[74px] overflow-visible rounded-md bg-elevated">
                    <div className="absolute inset-0 flex">
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
                    <div
                      className="absolute inset-y-0 bg-black/55"
                      style={{ left: 0, width: `${trimStartPercent}%` }}
                    />
                    <div
                      className="absolute inset-y-0 bg-black/55"
                      style={{ left: `${trimEndPercent}%`, right: 0 }}
                    />
                    <div
                      className="absolute inset-y-0 rounded-md border border-cyan shadow-[0_0_0_2px_rgba(34,211,238,0.22)]"
                      style={{
                        left: `${trimStartPercent}%`,
                        right: `${100 - trimEndPercent}%`,
                      }}
                    />
                    <div
                      onPointerDown={beginPlayheadDrag}
                      onPointerMove={updatePlayheadDrag}
                      className="absolute -bottom-10 -top-12 z-50 w-5 -translate-x-1/2 cursor-ew-resize touch-none"
                      style={{ left: `${playheadPercent}%` }}
                    >
                      <div className="mx-auto h-full w-px bg-cyan" />
                      <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-cyan" />
                    </div>
                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label={t('trimStart')}
                      aria-valuemin={0}
                      aria-valuemax={Math.floor(trimEndPercent - 1)}
                      aria-valuenow={Math.floor(trimStartPercent)}
                      onPointerDown={(event) => beginTrimHandleDrag('start', event)}
                      onPointerMove={(event) => updateTrimHandleDrag('start', event)}
                      className="absolute top-1 z-40 h-[66px] w-2 -translate-x-1/2 cursor-ew-resize touch-none rounded-l-md border border-cyan bg-white shadow-sm"
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
                      className="absolute top-1 z-40 h-[66px] w-2 -translate-x-1/2 cursor-ew-resize touch-none rounded-r-md border border-cyan bg-white shadow-sm"
                      style={{ left: `${trimEndPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span>{formatDuration(trimStartSeconds)}</span>
                    <span className="font-semibold text-text-primary">{t('trimVideo')}</span>
                    <span>{formatDuration(trimEndSeconds || videoDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface border border-elevated rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
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
