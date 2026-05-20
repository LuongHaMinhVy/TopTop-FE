"use client";

import { Repeat2 } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { VideoRepostUser } from "@/types/video";

interface RepostBadgeProps {
  users: VideoRepostUser[];
  count?: number;
  onRepost?: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  className?: string;
  popoverPlacement?: "top" | "bottom";
}

function displayName(user: VideoRepostUser) {
  return user.isCurrentUser ? "Bạn" : (user.nickname || user.username).replace(/^@/, "");
}

function AvatarStack({ users }: { users: VideoRepostUser[] }) {
  return (
    <div className="flex -space-x-1">
      {users.slice(0, 2).map((user) => (
        <div
          key={user.id}
          className="relative size-4 overflow-hidden rounded-full border border-white/80 bg-[#2a2a2a]"
        >
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={displayName(user)} fill className="object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-[9px] font-bold text-white">
              {displayName(user).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function RepostBadge({
  users,
  count,
  onRepost,
  onRemove,
  showRemoveButton = true,
  className = "",
  popoverPlacement = "top",
}: RepostBadgeProps) {
  if (users.length === 0) return null;

  const currentUserRepost = users.find((user) => user.isCurrentUser);
  const repostCount = Math.max(count ?? users.length, users.length);
  const label =
    repostCount === 1
      ? currentUserRepost
        ? "Bạn đã đăng lại"
        : `${displayName(users[0])} đã đăng lại`
      : `${repostCount} đã đăng lại`;
  const popoverPosition =
    popoverPlacement === "bottom"
      ? "top-full mt-1"
      : "bottom-full mb-1";
  const actionHandler = onRemove ?? onRepost;
  const actionLabel = onRemove ? "Xóa đăng lại" : "Đăng lại";

  return (
    <div className={`relative flex w-fit items-center gap-1.5 pointer-events-auto ${className}`}>
      <div className="group/repost-badge relative">
        <div className="flex items-center gap-1.5 rounded-full bg-black/52 px-3 py-1.5 text-[13px] font-bold leading-none text-white shadow-[0_3px_10px_rgba(0,0,0,0.32)] ring-1 ring-white/12 backdrop-blur-md">
          <AvatarStack users={users} />
          <span className="max-w-[160px] truncate">{label}</span>
        </div>

        <div
          className={`absolute left-0 z-[120] hidden min-w-[178px] rounded-lg bg-[#333] px-2.5 py-2 text-white shadow-2xl ring-1 ring-white/10 group-hover/repost-badge:block ${popoverPosition}`}
        >
          <div className="space-y-1">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/@${user.username}`}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition hover:bg-white/10"
              >
                <div className="relative size-7 overflow-hidden rounded-full bg-[#202020]">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={displayName(user)} fill className="object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-[12px] font-bold">
                      {displayName(user).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                  {displayName(user)}
                </span>
                {user.isCurrentUser && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold">
                    Đã đăng lại
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {actionHandler && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            actionHandler();
          }}
          className={`grid size-8 place-items-center rounded-full bg-black/50 text-white shadow-[0_3px_10px_rgba(0,0,0,0.32)] ring-1 ring-white/12 backdrop-blur-md transition hover:bg-black/65 ${
            showRemoveButton ? "" : "hidden"
          }`}
          aria-label={actionLabel}
        >
          <Repeat2 className="size-4 text-yellow-400" />
        </button>
      )}
    </div>
  );
}
