"use client";

import type { ConversationResponseDTO } from "@/types/chat";
import { Avatar } from "@repo/ui";
import { formatChatTimestamp } from "./chat-time";
import { useTranslations } from "next-intl";

interface ConversationItemProps {
  conversation: ConversationResponseDTO;
  isActive?: boolean;
  onClick: () => void;
}

export const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  const t = useTranslations("Chat");
  const targetUser = conversation.targetUser;
  if (!targetUser) return null;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-hover transition-colors ${
        isActive ? 'bg-elevated' : ''
      }`}
    >
      <div className="relative">
        <Avatar src={targetUser.avatarUrl} alt={targetUser.displayName} size="md" />
        {targetUser.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="font-bold truncate text-[15px]">{targetUser.displayName}</span>
          {conversation.lastMessageAt && (
            <span className="text-[12px] text-text-muted flex-shrink-0">
              {formatChatTimestamp(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-[14px] truncate ${conversation.unreadCount > 0 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
            {conversation.lastMessagePreview || t("startedConversation")}
          </p>
          {conversation.unreadCount > 0 && (
            <div className="bg-brand text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ml-2">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
