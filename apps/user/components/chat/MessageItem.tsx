"use client";

import type { MessageResponseDTO } from "@/types/chat";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface MessageItemProps {
  message: MessageResponseDTO;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  return (
    <div className={`flex flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
      <div 
        className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] ${
          message.mine 
            ? 'bg-brand text-white rounded-tr-none' 
            : 'bg-elevated text-text-primary rounded-tl-none'
        }`}
      >
        {message.type === 'TEXT' && <p>{message.body}</p>}
        {message.type === 'VIDEO_SHARE' && (
          <div className="bg-black/20 p-2 rounded-lg">
             {/* Simple video share preview placeholder */}
             <p className="text-[13px] opacity-80 italic">Shared a video</p>
             {message.attachment?.videoId && (
               <div className="mt-2 text-xs underline">View Video</div>
             )}
          </div>
        )}
      </div>
      <span className="text-[11px] text-text-muted mt-1 px-1">
        {format(new Date(message.createdAt), 'HH:mm', { locale: dateLocale })}
      </span>
    </div>
  );
};
