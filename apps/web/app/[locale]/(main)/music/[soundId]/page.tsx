"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Music, Pause, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useSoundDetail, useSoundVideos } from "@/hooks/sound-hooks";
import { FavoriteVideoTile } from "@/components/collection/CollectionUi";
import { videoPath } from "@/utils/video-url";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { formatCount } from "@/utils/format-count";

export default function SoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const t = useTranslations("sound");
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const soundId = Number(params.soundId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: soundRes, isLoading, isError } = useSoundDetail(soundId, Number.isFinite(soundId));
  const { data: videosRes } = useSoundVideos(soundId);
  const sound = soundRes?.data;
  const videos = useMemo(
    () => videosRes?.pages.flatMap((page) => page.data ?? []) ?? [],
    [videosRes?.pages],
  );

  const togglePreview = () => {
    if (!sound?.audioUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(sound.audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const handleUseSound = () => {
    if (!sound) return;
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }
    router.push(`/toptopstudio/upload?soundId=${sound.id}`);
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
        <div className="relative grid size-28 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-elevated sm:size-36">
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
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[30px] font-black leading-tight">{sound.title}</h1>
          <p className="mt-1 text-[16px] font-semibold text-text-secondary">
            {sound.artistName || sound.owner?.displayName || sound.owner?.username || "TopTop"}
          </p>
          <p className="mt-2 text-sm font-semibold text-text-muted">
            {t("videoCount", { count: formatCount(sound.stats?.usageCount ?? 0) })}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUseSound}
              className="h-10 rounded-md bg-brand px-6 text-[15px] font-bold text-white hover:bg-brand-dark"
            >
              {t("useThisSound")}
            </button>
            <button
              type="button"
              onClick={togglePreview}
              className="flex h-10 items-center gap-2 rounded-md bg-elevated px-5 text-[15px] font-bold hover:bg-hover"
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              {isPlaying ? t("pause") : t("play")}
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
