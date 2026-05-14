"use client";

import { Download, Info, Link2, Send } from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface VideoContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition;
  canDownload?: boolean;
  onDownload: () => void;
  onSendToFriends: () => void;
  onCopyLink: () => void;
  onViewDetails: () => void;
}

export function VideoContextMenu({
  isOpen,
  position,
  canDownload = true,
  onDownload,
  onSendToFriends,
  onCopyLink,
  onViewDetails,
}: VideoContextMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      label: "Tải về video",
      icon: Download,
      onClick: onDownload,
      disabled: !canDownload,
    },
    {
      label: "Gửi đến bạn bè",
      icon: Send,
      onClick: onSendToFriends,
      disabled: false,
    },
    {
      label: "Sao chép liên kết",
      icon: Link2,
      onClick: onCopyLink,
      disabled: false,
    },
    {
      label: "Xem chi tiết video",
      icon: Info,
      onClick: onViewDetails,
      disabled: false,
    },
  ];

  return (
    <div
      role="menu"
      aria-label="Tùy chọn video"
      className="
        fixed z-[9999] w-[260px] overflow-hidden rounded-xl border border-white/10
        bg-neutral-800/95 p-1 text-white shadow-2xl backdrop-blur-xl
      "
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={item.onClick}
            className="
              flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-[15px]
              font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
