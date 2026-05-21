"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSounds } from "@/hooks/sound-hooks";
import { useDebounce } from "@/hooks/useDebounce";
import type { Sound } from "@/types/sound";

interface SoundPickerProps {
  selectedSound?: Sound | null;
  onSelectSound: (sound: Sound) => void;
  onClearSound: () => void;
}

export function SoundPicker({ selectedSound, onSelectSound, onClearSound }: SoundPickerProps) {
  const t = useTranslations("sound");
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [playingSoundId, setPlayingSoundId] = useState<number | null>(null);
  const debouncedKeyword = useDebounce(keyword, 300);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useSounds({ keyword: debouncedKeyword || undefined, size: 20 }, isOpen);
  const sounds = data?.data ?? [];

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePreview = (sound: Sound) => {
    if (playingSoundId === sound.id) {
      audioRef.current?.pause();
      setPlayingSoundId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(sound.audioUrl);
    audioRef.current = audio;
    setPlayingSoundId(sound.id);
    audio.onended = () => setPlayingSoundId(null);
    audio.play().catch(() => setPlayingSoundId(null));
  };

  return (
    <div className="rounded-lg border border-elevated bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{t("title")}</p>
          <p className="mt-1 text-xs text-text-muted">{t("originalHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-9 rounded-md bg-elevated px-4 text-sm font-bold hover:bg-hover"
        >
          {selectedSound ? t("change") : t("select")}
        </button>
      </div>

      {selectedSound ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-elevated/50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Music className="size-4 flex-shrink-0 text-brand" />
            <span className="truncate text-sm font-semibold">{selectedSound.title}</span>
          </div>
          <button type="button" onClick={onClearSound} className="text-xs font-bold text-text-muted hover:text-text-primary">
            {t("clear")}
          </button>
        </div>
      ) : null}

      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[80vh] w-full max-w-[520px] flex-col rounded-xl border border-elevated bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-elevated px-5 py-4">
              <h3 className="text-lg font-bold">{t("select")}</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-hover">
                <X className="size-5" />
              </button>
            </div>

            <div className="border-b border-elevated p-4">
              <div className="flex items-center gap-2 rounded-md border border-elevated px-3 py-2">
                <Search className="size-4 text-text-muted" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-text-muted">{t("loading")}</div>
              ) : sounds.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">{t("empty")}</div>
              ) : (
                sounds.map((sound) => (
                  <div key={sound.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-hover">
                    <button
                      type="button"
                      onClick={() => togglePreview(sound)}
                      className="grid size-9 flex-shrink-0 place-items-center rounded-full bg-elevated"
                    >
                      {playingSoundId === sound.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{sound.title}</p>
                      <p className="truncate text-xs text-text-muted">{sound.artistName || sound.owner?.displayName || sound.owner?.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        audioRef.current?.pause();
                        setPlayingSoundId(null);
                        onSelectSound(sound);
                        setIsOpen(false);
                      }}
                      className="h-8 rounded-md bg-brand px-3 text-xs font-bold text-white"
                    >
                      {t("use")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
