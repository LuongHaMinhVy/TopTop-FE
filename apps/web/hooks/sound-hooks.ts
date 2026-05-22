import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as soundService from "@/services/sound-api-service";
import type { SoundDetail, SoundType } from "@/types/sound";

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

export const useFavoriteSounds = (enabled = true, page = 0, size = 50) => {
  return useQuery({
    queryKey: ["favorite-sounds", page, size],
    queryFn: () => soundService.getFavoriteSounds(page, size),
    enabled,
    staleTime: 30_000,
  });
};

export const useToggleSaveSound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ soundId, isSaved }: { soundId: number; isSaved: boolean }) =>
      isSaved ? soundService.unsaveSound(soundId) : soundService.saveSound(soundId),
    onMutate: async ({ soundId, isSaved }) => {
      const detailKey = ["sound-detail", soundId];
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof soundService.getSoundDetail>>>(detailKey);

      queryClient.setQueryData<Awaited<ReturnType<typeof soundService.getSoundDetail>>>(detailKey, (current) => {
        if (!current?.data) return current;
        const savedCount = current.data.stats?.savedCount ?? 0;
        const nextSound: SoundDetail = {
          ...current.data,
          isSaved: !isSaved,
          stats: {
            usageCount: current.data.stats?.usageCount ?? 0,
            videoCount: current.data.stats?.videoCount ?? 0,
            soundId: current.data.stats?.soundId ?? soundId,
            savedCount: Math.max(0, savedCount + (isSaved ? -1 : 1)),
            isSaved: !isSaved,
          },
        };
        return { ...current, data: nextSound };
      });

      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["sound-detail", variables.soundId], context.previous);
      }
    },
    onSuccess: (response, variables) => {
      const stats = response.data;
      if (stats) {
        queryClient.setQueryData<Awaited<ReturnType<typeof soundService.getSoundDetail>>>(["sound-detail", variables.soundId], (current) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              isSaved: stats.isSaved ?? false,
              stats,
            },
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["favorite-sounds"] });
      queryClient.invalidateQueries({ queryKey: ["sounds"] });
    },
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
