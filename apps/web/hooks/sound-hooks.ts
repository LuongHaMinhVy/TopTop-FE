import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as soundService from "@/services/sound-api-service";
import type { SoundType } from "@/types/sound";

export const useSounds = (
  params: { keyword?: string; type?: SoundType; page?: number; size?: number } = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: ["sounds", params],
    queryFn: () => soundService.getSounds(params),
    enabled,
    staleTime: 60_000,
  });
};

export const useSoundDetail = (soundId?: number, enabled = true) => {
  return useQuery({
    queryKey: ["sound-detail", soundId],
    queryFn: () => soundService.getSoundDetail(soundId!),
    enabled: enabled && Boolean(soundId),
    staleTime: 60_000,
  });
};

export const useSoundVideos = (soundId?: number, size = 20) => {
  return useInfiniteQuery({
    queryKey: ["sound-videos", soundId, size],
    queryFn: ({ pageParam = 0 }) => soundService.getSoundVideos(soundId!, pageParam, size),
    enabled: Boolean(soundId),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      const nextPage = meta.page + 1;
      return nextPage < meta.totalPages ? nextPage : undefined;
    },
  });
};
