"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Bookmark, Loader2, Music, Pause, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useSoundDetail, useSoundVideos, useToggleSaveSound } from "@/hooks/sound-hooks";
import { FavoriteVideoTile } from "@/components/collection/CollectionUi";
import { videoPath } from "@/utils/video-url";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { formatCount } from "@/utils/format-count";

export default function SoundDetailPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const t = useTranslations("sound");
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const soundId = Number(params.soundId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const { data: soundRes, isLoading, isError } = useSoundDetail(soundId, Number.isFinite(soundId));
  const { data: videosRes } = useSoundVideos(soundId);
  const toggleSaveSound = useToggleSaveSound();
  const sound = soundRes?.data;
  const videos = useMemo(
    () => videosRes?.pages.flatMap((page) => page.data ?? []) ?? [],
    [videosRes?.pages],
  );
  const displayAudioDuration = audioDuration || sound?.durationSeconds || 0;
const hasAudioDuration = displayAudioDuration > 0;

  const togglePreview = () => {
    if (!sound?.audioUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current ?? new Audio(sound.audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => {
      setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : sound.durationSeconds);
    };
    audio.ontimeupdate = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : sound.durationSeconds;
      setAudioDuration(duration);
      setAudioProgress(duration > 0 ? Math.min(1, audio.currentTime / duration) : 0);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      audio.currentTime = 0;
    };
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handleToggleSave = () => {
    if (!sound) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }
    toggleSaveSound.mutate({
      soundId: sound.id,
      isSaved: Boolean(sound.isSaved || sound.stats?.isSaved),
    });
  };

  if (isLoading) {
    return (
      <div className="h-full w-full overflow-y-auto px-5 py-8 sm:px-8">
        <div className="mb-8 h-36 max-w-3xl animate-pulse rounded-xl bg-elevated" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !sound) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t("loadError")}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-5 py-8 pb-24 sm:px-8 lg:px-10">
      <DocumentTitle title={`${sound.title} | TopTop`} />
      <section className="mb-8 flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={togglePreview}
          disabled={!sound.audioUrl}
          className="group relative grid size-28 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-elevated text-white shadow-lg transition hover:brightness-110 disabled:cursor-default sm:size-36"
          aria-label={isPlaying ? t("pause") : t("play")}
        >
          {sound.coverUrl || sound.owner?.avatarUrl ? (
            <Image
              src={sound.coverUrl || sound.owner?.avatarUrl || ""}
              alt={sound.title}
              fill
              className="object-cover"
            />
          ) : (
            <Music className="size-12 text-text-muted" />
          )}
          <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
          {hasAudioDuration && (
            <div className="absolute grid size-16 place-items-center rounded-full bg-black/35 backdrop-blur-sm sm:size-[72px]">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 72 72" aria-hidden="true">
                <circle
                  cx="36"
                  cy="36"
                  r="32"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - audioProgress)}`}
                  className="transition-[stroke-dashoffset] duration-150"
                />
              </svg>
              {isPlaying ? (
                <Pause className="relative z-10 size-7 fill-white sm:size-8" />
              ) : (
                <Play className="relative z-10 ml-1 size-7 fill-white sm:size-8" />
              )}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[30px] font-black leading-tight">{sound.title}</h1>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[16px] font-semibold text-text-secondary">
            <span className="truncate">
              {sound.artistName || (sound.owner?.username ? `@${sound.owner.username}` : "TopTop")}
            </span>
            <span className="text-text-muted">·</span>
            <span className="whitespace-nowrap text-text-primary">
              {t("videoCount", { count: formatCount(sound.stats?.usageCount ?? 0) })}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={toggleSaveSound.isPending}
              aria-pressed={Boolean(sound.isSaved || sound.stats?.isSaved)}
              className={`flex h-10 items-center gap-2 rounded-md px-5 text-[15px] font-bold transition ${
                sound.isSaved || sound.stats?.isSaved
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-elevated hover:bg-hover"
              } disabled:opacity-60`}
            >
              {toggleSaveSound.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bookmark
                  className="size-4"
                  fill={sound.isSaved || sound.stats?.isSaved ? "currentColor" : "none"}
                />
              )}
              {sound.isSaved || sound.stats?.isSaved ? t("saved") : t("save")}
            </button>
          </div>
        </div>
      </section>

      <h2 className="mb-4 text-xl font-bold">{t("videosTitle")}</h2>
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {videos.map((video) => (
            <FavoriteVideoTile
              key={video.id}
              video={video}
              href={videoPath(video.username, video.id, { from: "sound" })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-elevated py-16 text-center text-text-secondary">
          {t("videosEmpty")}
        </div>
      )}
    </div>
  );
}
