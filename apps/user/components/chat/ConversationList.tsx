"use client";

import { useConversations } from "@/hooks/chat-hooks";
import { ConversationItem } from "./ConversationItem";
import { useTranslations } from "next-intl";
import { Skeleton } from "@repo/ui";

interface ConversationListProps {
  selectedId?: number;
  onSelect: (id: number) => void;
}

export const ConversationList = ({ selectedId, onSelect }: ConversationListProps) => {
  const t = useTranslations('Chat');
  const { data, isLoading } = useConversations();
  const conversations = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-elevated">
        <h1 className="text-xl font-bold">{t('messages')}</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {t('noConversations')}
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
