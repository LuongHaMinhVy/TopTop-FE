"use client";

import type { MessageResponseDTO } from "@/types/chat";
import Link from "next/link";
import { Play } from "lucide-react";
import { formatChatTimestamp } from "./chat-time";
import Image from "next/image";

interface MessageItemProps {
  message: MessageResponseDTO;
  chatVideosStr?: string;
}

export const MessageItem = ({ message, chatVideosStr = "" }: MessageItemProps) => {
  const attachment = message.attachment;
  const messageTime = formatChatTimestamp(message.createdAt);
  const videoHref = attachment?.ownerUsername && attachment.videoId
    ? `/@${attachment.ownerUsername}/video/${attachment.videoId}`
    : attachment?.videoId
      ? `/@user/video/${attachment.videoId}`
      : attachment?.url || attachment?.videoUrl || "#";
  const videoTitle = attachment?.title || attachment?.videoTitle || "TikTok Video";
  const bubbleClassName = `max-w-[70%] px-4 py-2 rounded-2xl text-[15px] ${
    message.mine
      ? 'bg-brand text-white rounded-tr-none'
      : 'bg-elevated text-text-primary rounded-tl-none'
  }`;

  if (message.type === 'VIDEO_SHARE') {
    return (
      <div className={`flex flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
        {message.body && (
          <div className={bubbleClassName}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </div>
        )}

        {attachment && (
          <Link
            href={`${videoHref}?from=chat&conversationId=${message.conversationId}${chatVideosStr ? '&chatVideos=' + chatVideosStr : ''}`}
            className="mt-1 block relative overflow-hidden rounded-xl w-[180px] aspect-[9/16] bg-black group"
          >
            {attachment.thumbnailUrl ? (
              <Image
                src={attachment.thumbnailUrl}
                alt="Video cover"
                fill
                sizes="180px"
                className="object-cover opacity-90 transition group-hover:opacity-100"
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

        <span className="text-[11px] text-text-muted mt-1 px-1">
          {messageTime}
        </span>
      </div>
    );
  }

  if ((message.type === 'IMAGE' || message.type === 'VIDEO') && attachment) {
    const mediaUrl = attachment.url || attachment.videoUrl || "";
    return (
      <div className={`flex flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
        {message.body && (
          <div className={bubbleClassName}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </div>
        )}
        <div className="mt-1 max-w-[240px] overflow-hidden rounded-xl bg-black">
          {message.type === 'IMAGE' ? (
            <Image
              src={mediaUrl}
              alt={attachment.fileName || "Image"}
              width={240}
              height={320}
              className="max-h-[320px] w-full object-cover"
            />
          ) : (
            <video src={mediaUrl} controls className="max-h-[320px] w-full bg-black" />
          )}
        </div>
        <span className="text-[11px] text-text-muted mt-1 px-1">
          {messageTime}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
      <div className={bubbleClassName}>
        {message.type === 'TEXT' && <p>{message.body}</p>}
      </div>
      <span className="text-[11px] text-text-muted mt-1 px-1">
        {messageTime}
      </span>
    </div>
  );
};
