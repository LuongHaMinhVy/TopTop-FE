"use client";

import { useMessages, useMarkAsRead } from "@/hooks/chat-hooks";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Info, MessageSquare } from "lucide-react";
import { Avatar, Spinner } from "@repo/ui";
import type { ConversationResponseDTO } from "@/types/chat";
import { useRouter } from "@/i18n/routing";

interface ChatWindowProps {
  conversation: ConversationResponseDTO | null;
}

export const ChatWindow = ({ conversation }: ChatWindowProps) => {
  const t = useTranslations('Chat');
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const markAsRead = useMarkAsRead();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversation?.id || null);

  const messages = data?.pages.flatMap((page) => page.data || []).reverse() || [];

  useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      markAsRead.mutate(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount, markAsRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted bg-background">
        <MessageSquare size={64} className="mb-4 opacity-20" strokeWidth={1} />
        <h2 className="text-xl font-bold text-text-primary">{t('emptyTitle')}</h2>
        <p className="max-w-[300px] text-center mt-2">{t('emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <button
        type="button"
        onClick={() => {
          if (conversation.targetUser?.username) {
            router.push(`/@${conversation.targetUser.username}`);
          }
        }}
        className="flex items-center gap-3 p-3 border-b border-elevated sticky top-0 bg-background/80 backdrop-blur-md z-10 text-left hover:bg-hover"
      >
        <Avatar src={conversation.targetUser?.avatarUrl} alt={conversation.targetUser?.displayName || ""} size="sm" />
        <div className="flex flex-col min-w-0">
          <span className="font-bold truncate">{conversation.targetUser?.displayName}</span>
          <span className="text-[12px] text-text-muted">
            {conversation.targetUser?.username ? `@${conversation.targetUser.username}` : ""}
          </span>
        </div>
      </button>

      {conversation.status === "REQUESTED" && (
        <div className="flex items-start gap-2 border-b border-elevated bg-elevated/30 px-4 py-3 text-[13px] text-text-secondary">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
          <p>{t('messageRequestNotice')}</p>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar"
      >
        {hasNextPage && (
          <button 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
            className="text-xs text-brand hover:underline self-center py-2"
          >
            {isFetchingNextPage ? <Spinner size="sm" /> : t('loadMore')}
          </button>
        )}
        
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            chatVideosStr={messages
              .filter(m => m.type === 'VIDEO_SHARE' && m.attachment?.videoId)
              .map(m => m.attachment!.videoId)
              .reverse()
              .join(',')}
          />
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-elevated">
        <ChatInput conversationId={conversation.id} />
      </div>
    </div>
  );
};
