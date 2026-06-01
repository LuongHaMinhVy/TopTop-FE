"use client";

import type { MessageResponseDTO } from "@/types/chat";
import Link from "next/link";
import { MoreHorizontal, Play, Trash2, AlertCircle } from "lucide-react";
import { formatChatTimestamp } from "./chat-time";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";

interface MessageItemProps {
  message: MessageResponseDTO;
  chatVideosStr?: string;
  onDelete?: (messageId: number) => void;
}

export const MessageItem = ({ message, chatVideosStr = "", onDelete }: MessageItemProps) => {
  const t = useTranslations("Chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const attachment = message.attachment;
  const messageTime = formatChatTimestamp(message.createdAt);
  const videoHref = attachment?.ownerUsername && attachment.videoId
    ? `/@${attachment.ownerUsername}/video/${attachment.videoId}`
    : attachment?.videoId
      ? `/@user/video/${attachment.videoId}`
      : attachment?.url || attachment?.videoUrl || "#";
  const videoTitle = attachment?.title || attachment?.videoTitle || "TikTok Video";
  const canDelete = Boolean(message.mine && onDelete);
  const bubbleClassName = `max-w-full px-4 py-2 rounded-2xl text-[15px] ${
    message.mine
      ? 'bg-brand text-white rounded-tr-none'
      : 'bg-elevated text-text-primary rounded-tl-none'
  }`;
  const handleDelete = () => {
    setMenuOpen(false);
    if (!window.confirm(t("deleteMessageConfirm"))) return;
    onDelete?.(message.id);
  };
  const renderActions = () => {
    if (!canDelete) return null;

    return (
      <div
        className={`absolute bottom-0 right-full z-20 mr-1 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 ${
          menuOpen ? "opacity-100" : ""
        }`}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          className="grid size-8 place-items-center rounded-full bg-background/80 text-text-muted shadow-sm backdrop-blur hover:bg-elevated hover:text-text-primary"
          aria-label={t("messageActions")}
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <div className="absolute bottom-10 right-0 z-30 min-w-36 rounded-lg border border-elevated bg-elevated px-2 py-2 shadow-2xl">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-background/60"
            >
              <Trash2 size={16} />
              {t("deleteMessage")}
            </button>
            <span className="absolute -bottom-2 right-5 size-4 rotate-45 border-b border-r border-elevated bg-elevated" />
          </div>
        )}
      </div>
    );
  };
  const renderShell = (children: ReactNode) => (
    <div className={`group/message flex w-full ${message.mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[72%] flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
        <div className="relative max-w-full">
          {message.mine ? renderActions() : null}
          <div className={`flex max-w-full flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
            {children}
          </div>
        </div>
        <span className="text-[11px] text-text-muted mt-1 px-1">
          {messageTime}
        </span>
      </div>
    </div>
  );

  if (message.type === 'VIDEO_SHARE') {
    return renderShell(
      <>
        {message.body && (
          <div className={bubbleClassName}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </div>
        )}

        {attachment && (
          <Link
            href={`${videoHref}?from=chat&conversationId=${message.conversationId}${chatVideosStr ? '&chatVideos=' + chatVideosStr : ''}`}
            className="group/video mt-1 block relative overflow-hidden rounded-xl w-[180px] aspect-[9/16] bg-black"
          >
            {attachment.thumbnailUrl ? (
              <Image
                src={attachment.thumbnailUrl}
                alt="Video cover"
                fill
                sizes="180px"
                className="object-cover opacity-90 transition group-hover/video:opacity-100"
              />
            ) : (
              <div className="w-full h-full bg-elevated" />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <Play className="size-6 fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pointer-events-none flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <div className="relative size-5 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
                  {attachment.thumbnailUrl && (
                    <Image
                      src={attachment.thumbnailUrl}
                      alt=""
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="text-white text-[12px] font-semibold truncate">
                  {videoTitle}
                </p>
              </div>
            </div>
          </Link>
        )}
      </>
    );
  }

  if ((message.type === 'IMAGE' || message.type === 'VIDEO') && attachment) {
    const mediaUrl = attachment.url || attachment.videoUrl || "";
    const isSending = message.status === 'SENDING';
    const isFailed = message.status === 'FAILED';
    
    return renderShell(
      <>
        {message.body && (
          <div className={`${bubbleClassName} ${isSending ? 'opacity-70' : ''}`}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </div>
        )}
        <div className={`mt-1 max-w-[240px] overflow-hidden rounded-xl bg-black relative ${isSending ? 'opacity-70' : ''}`}>
          {message.type === 'IMAGE' ? (
            <Image
              src={mediaUrl}
              alt={attachment.fileName || "Image"}
              width={240}
              height={320}
              unoptimized={mediaUrl.startsWith("blob:") || mediaUrl.startsWith("data:")}
              className={`max-h-[320px] w-full object-cover transition-all ${isSending ? 'blur-md' : ''}`}
            />
          ) : (
            <video src={mediaUrl} controls={!isSending} className={`max-h-[320px] w-full bg-black ${isSending ? 'blur-md' : ''}`} />
          )}
          
          {isSending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="size-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {isFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <div className="flex flex-col items-center gap-1 text-brand">
                <AlertCircle size={24} />
                <span className="text-[11px] font-semibold text-white">Lỗi gửi file</span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return renderShell(
    <>
      <div className={bubbleClassName}>
        {message.type === 'TEXT' && <p>{message.body}</p>}
      </div>
    </>
  );
};
