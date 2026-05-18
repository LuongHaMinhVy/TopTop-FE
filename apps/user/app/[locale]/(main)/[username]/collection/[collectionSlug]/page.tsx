"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal, PlusCircle, Share2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  useAddVideoToCollectionMutation,
  useBulkRemoveCollectionVideosMutation,
  useCollectionDetail,
  useDeleteCollectionMutation,
  useFavoriteVideos,
  usePublicCollectionVideos,
  useUpdateCollectionMutation,
} from "@/hooks/collection-hooks";
import {
  CollectionFormModal,
  CollectionSettingsMenu,
  FavoriteVideoTile,
  SelectVideosModal,
  ShareModal,
} from "@/components/collection/CollectionUi";
import { formatCount } from "@/utils/format-count";
import { collectionIdFromSlug } from "@/utils/collection-url";
import { videoPath } from "@/utils/video-url";

const COLLECTION_VIDEO_BATCH_SIZE = 18;

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const collectionSlug = params.collectionSlug as string;
  const collectionId = collectionIdFromSlug(collectionSlug);
  const decodedUsername = decodeURIComponent(rawUsername);
  const username = decodedUsername.startsWith("@") ? decodedUsername.substring(1) : decodedUsername;
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [visibleVideoCount, setVisibleVideoCount] = useState(COLLECTION_VIDEO_BATCH_SIZE);

  const { data: collectionRes, isLoading: isLoadingCollection, isError } = useCollectionDetail(username, collectionId);
  const { data: videosRes, isFetching: isFetchingVideos, isLoading: isLoadingVideos } = usePublicCollectionVideos(
    username,
    collectionId,
    true,
    0,
    visibleVideoCount,
  );
  const { data: favoriteVideosRes } = useFavoriteVideos(currentUser?.username === username);
  const updateCollectionMutation = useUpdateCollectionMutation();
  const deleteCollectionMutation = useDeleteCollectionMutation();
  const addVideoMutation = useAddVideoToCollectionMutation();
  const bulkRemoveMutation = useBulkRemoveCollectionVideosMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const collection = collectionRes?.data;
  const videos = useMemo(() => videosRes?.data ?? [], [videosRes?.data]);
  const totalVideos = videosRes?.meta?.totalElements ?? videos.length;
  const canLoadMoreVideos = videos.length < totalVideos;
  const favoriteVideos = favoriteVideosRes?.data ?? [];
  const isOwner = currentUser?.username === username;
  const existingVideoIds = useMemo(() => videos.map((video) => video.id), [videos]);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !canLoadMoreVideos || isFetchingVideos) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisibleVideoCount((count) => Math.min(count + COLLECTION_VIDEO_BATCH_SIZE, totalVideos));
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMoreVideos, isFetchingVideos, totalVideos]);

  const toggleVideo = (videoId: number) => {
    setSelectedVideoIds((current) =>
      current.includes(videoId) ? current.filter((id) => id !== videoId) : [...current, videoId]
    );
  };

  const handleAddVideos = async (videoIds: number[]) => {
    await Promise.all(videoIds.map((videoId) => addVideoMutation.mutateAsync({ collectionId, videoId })));
    setIsAddModalOpen(false);
  };

  const handleRemoveSelected = async () => {
    if (selectedVideoIds.length === 0) return;
    await bulkRemoveMutation.mutateAsync({ collectionId, videoIds: selectedVideoIds });
    setSelectedVideoIds([]);
  };

  const handleRename = async (payload: { name: string; isPublic: boolean }) => {
    if (!collection) return;
    await updateCollectionMutation.mutateAsync({
      collectionId,
      payload: {
        name: payload.name,
        description: collection.description ?? undefined,
        isPublic: payload.isPublic,
      },
    });
    setIsRenameOpen(false);
  };

  const handleTogglePublic = async () => {
    if (!collection) return;
    await updateCollectionMutation.mutateAsync({
      collectionId,
      payload: {
        name: collection.name,
        description: collection.description ?? undefined,
        isPublic: !collection.isPublic,
      },
    });
    setIsSettingsOpen(false);
  };

  const handleDelete = async () => {
    if (!collection) return;
    const confirmed = window.confirm("Xóa bộ sưu tập này?");
    if (!confirmed) return;
    await deleteCollectionMutation.mutateAsync(collectionId);
    router.push(`/@${username}`);
  };

  if (isNaN(collectionId) || isError) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Không tìm thấy bộ sưu tập.
      </div>
    );
  }

  if (isLoadingCollection || !collection) {
    return (
      <div className="h-full w-full overflow-y-auto px-5 py-10 sm:px-8 lg:px-10 xl:px-12">
        <div className="mb-10 flex items-center gap-5 animate-pulse">
          <div className="size-28 rounded-full bg-elevated" />
          <div className="space-y-3">
            <div className="h-8 w-72 rounded bg-elevated" />
            <div className="h-5 w-36 rounded bg-elevated" />
          </div>
        </div>
      </div>
    );
  }

  if (isManageMode) {
    return (
      <div className="h-full w-full overflow-y-auto px-5 py-10 sm:px-8 lg:px-10 xl:px-12">
        <div className="sticky top-0 z-40 mb-10 flex h-16 items-center justify-between bg-background/95 backdrop-blur">
          <div className="flex gap-5">
            <button
              type="button"
              disabled={selectedVideoIds.length === 0 || bulkRemoveMutation.isPending}
              onClick={handleRemoveSelected}
              className="h-12 rounded-md bg-elevated px-12 text-[18px] font-bold disabled:opacity-40"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={() => setSelectedVideoIds(videos.map((video) => video.id))}
              className="h-12 rounded-md bg-elevated px-8 text-[18px] font-bold"
            >
              Chọn tất cả
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsManageMode(false);
              setSelectedVideoIds([]);
            }}
            className="h-12 rounded-md bg-elevated px-10 text-[18px] font-bold"
          >
            Hủy
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {videos.map((video) => (
            <FavoriteVideoTile
              key={video.id}
              video={video}
              selectable
              selected={selectedVideoIds.includes(video.id)}
              onSelect={() => toggleVideo(video.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-5 py-10 sm:px-8 lg:px-10 xl:px-12">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative size-28 overflow-hidden rounded-full bg-elevated">
            {currentUser?.avatarUrl && isOwner ? (
              <Image src={currentUser.avatarUrl} alt={currentUser.username} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[42px] font-bold">
                {username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-[32px] font-bold leading-tight">{collection.name}</h1>
            <p className="text-[18px] font-semibold text-text-secondary">{formatCount(collection.videoCount)} video</p>
            <p className="text-[18px] font-semibold text-text-secondary">Được tạo bởi {collection.ownerUsername ?? username}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex h-12 items-center gap-2 rounded-md bg-brand px-6 text-[18px] font-bold text-white"
              >
                <PlusCircle className="size-5" />
                Thêm video
              </button>
              <button
                type="button"
                onClick={() => setIsManageMode(true)}
                className="h-12 rounded-md bg-elevated px-6 text-[18px] font-bold hover:bg-hover"
              >
                Quản lý video
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="grid size-12 place-items-center rounded-full bg-elevated hover:bg-hover"
          >
            <Share2 className="size-6" />
          </button>
          {isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen((value) => !value)}
                className="grid size-12 place-items-center rounded-md bg-elevated hover:bg-hover"
              >
                <MoreHorizontal className="size-6" />
              </button>
              {isSettingsOpen && (
                <CollectionSettingsMenu
                  isPublic={collection.isPublic}
                  onTogglePublic={handleTogglePublic}
                  onRename={() => {
                    setIsSettingsOpen(false);
                    setIsRenameOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {isLoadingVideos ? (
          Array.from({ length: COLLECTION_VIDEO_BATCH_SIZE }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />)
        ) : videos.length > 0 ? (
          videos.map((video) => (
            <FavoriteVideoTile
              key={video.id}
              video={video}
              href={videoPath(video.username, video.id, {
                from: "collection",
                collectionId,
                collectionOwner: username,
              })}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-text-secondary">
            <Trash2 className="mb-4 size-16 opacity-20" />
            <p className="text-xl font-bold">Chưa có video nào</p>
          </div>
        )}
      </div>

      <div ref={loadMoreRef} className="h-12" />
      {isFetchingVideos && !isLoadingVideos && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: Math.min(6, Math.max(totalVideos - videos.length, 0)) }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      )}

      <SelectVideosModal
        isOpen={isAddModalOpen}
        videos={favoriteVideos}
        existingVideoIds={existingVideoIds}
        isSubmitting={addVideoMutation.isPending}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVideos}
      />
      <CollectionFormModal
        isOpen={isRenameOpen}
        title="Đổi tên bộ sưu tập"
        initialName={collection.name}
        initialPublic={collection.isPublic}
        isSubmitting={updateCollectionMutation.isPending}
        onClose={() => setIsRenameOpen(false)}
        onSubmit={handleRename}
      />
      <ShareModal isOpen={isShareOpen} url={shareUrl} onClose={() => setIsShareOpen(false)} />
    </div>
  );
}
