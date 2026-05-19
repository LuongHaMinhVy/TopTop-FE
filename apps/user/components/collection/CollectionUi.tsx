"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  Copy,
  Globe2,
  Loader2,
  Lock,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Facebook from "@/components/shared/icons/FaceBookIcon";
import Image from "next/image";
import Link from "next/link";
import { usePublicCollectionVideos } from "@/hooks/collection-hooks";
import type { VideoCollection } from "@/types/collection";
import type { Video } from "@/types/video";
import { formatCount } from "@/utils/format-count";

export function FavoriteVideoTile({
  video,
  href,
  selectable = false,
  selected = false,
  onSelect,
}: {
  video: Video;
  href?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const isUnavailable = Boolean(video.unavailable || video.deleted);
  const content = (
    <div
      className={`group relative aspect-[3/4] overflow-hidden rounded-lg bg-elevated ${
        isUnavailable ? "cursor-default" : ""
      }`}
      onClick={selectable ? onSelect : undefined}
    >
      {isUnavailable ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface-secondary px-4 text-center text-text-muted">
          <Trash2 className="mb-3 size-10 opacity-50" />
          <p className="text-[15px] font-bold text-text-secondary">Video không khả dụng</p>
          <p className="mt-1 text-[12px] font-semibold">Video này đã bị xóa hoặc không còn công khai.</p>
        </div>
      ) : video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <video
          src={video.fileUrl}
          className="h-full w-full object-cover"
          muted
          preload="metadata"
        />
      )}
      {!isUnavailable && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[15px] font-bold text-white">
            <span className="text-[18px] leading-none">▷</span>
            {formatCount(video.viewCount)}
          </div>
        </>
      )}
      {selectable && (
        <div
          className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full border-2 border-white ${
            selected ? "bg-brand" : "bg-black/20"
          }`}
        >
          {selected && <Check className="size-4 text-white" />}
        </div>
      )}
    </div>
  );

  if (selectable || !href) return content;
  return <Link href={href}>{content}</Link>;
}

export function CollectionCard({
  collection,
  href,
  ownerUsername,
}: {
  collection: VideoCollection;
  href: string;
  ownerUsername?: string;
}) {
  const collectionOwner = collection.ownerUsername ?? ownerUsername;
  const shouldLoadTopVideo =
    !collection.coverUrl && collection.videoCount > 0 && !!collectionOwner;
  const { data: topVideosRes } = usePublicCollectionVideos(
    collectionOwner,
    collection.id,
    shouldLoadTopVideo,
    0,
    1,
  );
  const topVideo = topVideosRes?.data?.[0];
  const coverUrl = collection.coverUrl ?? topVideo?.thumbnailUrl;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-[#303030]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={collection.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : topVideo?.fileUrl ? (
          <video
            src={topVideo.fileUrl}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            muted
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#333] to-[#242424] text-white/75">
            <Bookmark className="size-16" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="truncate text-[18px] font-bold">{collection.name}</p>
          <p className="text-[14px] font-semibold">
            {collection.videoCount} video
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CollectionFormModal({
  isOpen,
  title,
  initialName = "",
  initialPublic = false,
  isSubmitting = false,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  title: string;
  initialName?: string;
  initialPublic?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    isPublic: boolean;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState(initialName.slice(0, 30));
  const [isPublic, setIsPublic] = useState(initialPublic);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({ name: trimmed, isPublic });
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[450px] rounded-xl bg-[#222] p-7 text-white shadow-2xl"
      >
        <div className="mb-7 flex items-center justify-between">
          <h2 className="flex-1 text-center text-[22px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-7" />
          </button>
        </div>

        <label className="mb-3 block text-[16px] font-bold">
          Tên{" "}
          <span className="font-semibold text-white/50">
            ({name.length}/30)
          </span>
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 30))}
          className="mb-8 h-[60px] w-full rounded-lg bg-white/10 px-5 text-[18px] font-semibold outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20"
          placeholder="Tên bộ sưu tập"
        />

        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[17px] font-bold">
            {isPublic ? (
              <Globe2 className="size-5" />
            ) : (
              <Lock className="size-5" />
            )}
            Đặt ở chế độ công khai
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((value) => !value)}
            className={`relative h-8 w-[54px] rounded-full transition ${isPublic ? "bg-cyan-400" : "bg-white/20"}`}
            aria-pressed={isPublic}
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-white transition ${isPublic ? "left-7" : "left-1"}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="h-[50px] w-full rounded-md bg-brand text-[18px] font-bold text-white disabled:bg-brand/50 disabled:text-white/45"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto size-5 animate-spin" />
          ) : (
            "Lưu"
          )}
        </button>
      </form>
    </div>
  );
}

export function SelectVideosModal({
  isOpen,
  videos,
  existingVideoIds,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  videos: Video[];
  existingVideoIds: number[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (videoIds: number[]) => void | Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const existingSet = useMemo(
    () => new Set(existingVideoIds),
    [existingVideoIds],
  );
  const selectableVideos = videos.filter((video) => !existingSet.has(video.id));

  if (!isOpen) return null;

  const toggle = (videoId: number) => {
    setSelectedIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId],
    );
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 px-4">
      <div className="flex h-[80vh] w-full max-w-[600px] flex-col rounded-xl bg-[#202020] p-4 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-[22px] font-bold">
            Chọn video
          </h2>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-7" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {selectableVideos.map((video) => (
            <FavoriteVideoTile
              key={video.id}
              video={video}
              selectable
              selected={selectedIds.includes(video.id)}
              onSelect={() => toggle(video.id)}
            />
          ))}
          {selectableVideos.length === 0 && (
            <div className="col-span-full flex items-center justify-center text-white/60">
              Không có video để thêm
            </div>
          )}
        </div>

        <button
          disabled={selectedIds.length === 0 || isSubmitting}
          onClick={() => onSubmit(selectedIds)}
          className="mt-4 h-[50px] rounded-md bg-brand text-[18px] font-bold text-white disabled:bg-brand/50 disabled:text-white/45"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto size-5 animate-spin" />
          ) : (
            `Thêm video (${selectedIds.length})`
          )}
        </button>
      </div>
    </div>
  );
}

export function ShareModal({
  isOpen,
  url,
  onClose,
}: {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const shareItems = [
    {
      label: "Copy",
      icon: Copy,
      action: () => navigator.clipboard.writeText(url),
      className: "bg-violet-600",
    },
    {
      label: "WhatsApp",
      icon: Send,
      href: `https://wa.me/?text=${encodedUrl}`,
      className: "bg-green-500",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-blue-600",
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}`,
      className: "bg-sky-500",
    },
    {
      label: "X",
      icon: X,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
      className: "bg-black",
    },
  ];

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[600px] rounded-xl bg-[#222] p-7 text-white shadow-2xl">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="flex-1 text-center text-[22px] font-bold">
            Chia sẻ đến
          </h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-7" />
          </button>
        </div>
        <div className="flex gap-7 overflow-x-auto">
          {shareItems.map((item) => {
            const Icon = item.icon;
            const button = (
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`grid size-20 place-items-center rounded-full ${item.className}`}
                >
                  <Icon className="size-10 text-white" />
                </div>
                <span className="text-[14px] font-bold">{item.label}</span>
              </div>
            );
            if (item.href) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {button}
                </a>
              );
            }
            return (
              <button key={item.label} type="button" onClick={item.action}>
                {button}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CollectionSettingsMenu({
  isPublic,
  onTogglePublic,
  onRename,
  onDelete,
}: {
  isPublic: boolean;
  onTogglePublic: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute right-0 top-14 z-[200] w-[288px] overflow-hidden rounded-xl border border-white/15 bg-[#3f3f3f] p-2 text-white shadow-2xl">
      <button
        onClick={onTogglePublic}
        className="flex h-[58px] w-full items-center gap-3 rounded-lg px-3 text-left text-[18px] font-bold hover:bg-white/10"
      >
        {isPublic ? <Globe2 className="size-5" /> : <Lock className="size-5" />}
        <span className="min-w-0 flex-1 truncate">Đặt ở chế độ công khai</span>
        <span
          className={`relative h-8 w-[54px] rounded-full ${isPublic ? "bg-cyan-400" : "bg-white/20"}`}
        >
          <span
            className={`absolute top-1 size-6 rounded-full bg-white ${isPublic ? "left-7" : "left-1"}`}
          />
        </span>
      </button>
      <button
        onClick={onRename}
        className="flex h-[58px] w-full items-center gap-3 rounded-lg px-3 text-left text-[18px] font-bold hover:bg-white/10"
      >
        <Pencil className="size-5" />
        Đổi tên
      </button>
      <button
        onClick={onDelete}
        className="flex h-[58px] w-full items-center gap-3 rounded-lg px-3 text-left text-[18px] font-bold text-orange-500 hover:bg-white/10"
      >
        <Trash2 className="size-5" />
        Xóa bộ sưu tập
      </button>
    </div>
  );
}
