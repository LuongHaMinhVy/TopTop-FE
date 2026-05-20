"use client";

import { useConversations } from "@/hooks/chat-hooks";
import { ConversationItem } from "./ConversationItem";
import { useTranslations } from "next-intl";
import { Skeleton } from "@repo/ui";
import { ChevronRight, MessageCircleMore } from "lucide-react";
import type { ConversationStatus } from "@/types/chat";

type ConversationView = "inbox" | "requests";

interface ConversationListProps {
  selectedId?: number;
  view?: ConversationView;
  showHeader?: boolean;
  onViewChange?: (view: ConversationView) => void;
  onSelect: (id: number, status: ConversationStatus) => void;
}

/* ─────────────────────────────────────────────────────────────
   ConversationList Component
───────────────────────────────────────────────────────────── */
export const ConversationList = ({
  selectedId,
  view = "inbox",
  showHeader = true,
  onViewChange,
  onSelect,
}: ConversationListProps) => {
  const t = useTranslations('Chat');
  const activeStatus: ConversationStatus = view === "requests" ? "REQUESTED" : "ACTIVE";
  
  const { data, isLoading } = useConversations(0, 20, activeStatus);
  const { data: requestsData } = useConversations(0, 20, "REQUESTED");
  
  const conversations = data?.data || [];
  const requestConversations = requestsData?.data || [];
  
  const requestUnreadCount = requestConversations.reduce(
    (total, conv) => total + (conv.unreadCount || 0),
    0,
  );

  // Localization fallbacks
  const textMessageRequests = t('messageRequests');
  const textRequestsDesc = t('messageRequestsDesc');
  const textNoRequests = t('noRequests');

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 gap-4 bg-background h-full">
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
    <div className="flex flex-col h-full bg-background text-text-primary">
      {showHeader && (
        <div className="p-4 border-b border-elevated">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view === "requests" && (
                <button
                  type="button"
                  onClick={() => onViewChange?.("inbox")}
                  className="text-[13px] font-semibold text-text-secondary hover:text-text-primary mr-1"
                >
                  ←
                </button>
              )}
              <h1 className="text-xl font-bold">
                {view === "requests" ? textMessageRequests : t('messages')}
              </h1>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === "inbox" && requestConversations.length > 0 && (
          <button
            type="button"
            onClick={() => onViewChange?.("requests")}
            className="flex w-full items-center gap-3 border-b border-elevated/60 p-3 text-left transition-colors hover:bg-hover"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-text-primary">
              <MessageCircleMore size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-bold">
                  {textMessageRequests}
                </span>
                {requestUnreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                    {requestUnreadCount > 99 ? "99+" : requestUnreadCount}
                  </span>
                )}
              </div>
              <p className="truncate text-[13px] text-text-muted">
                {textRequestsDesc}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-muted" />
          </button>
        )}
        
        {conversations.length === 0 ? (
          <div className="p-5 text-center text-text-muted text-[13px]">
            {view === "requests" ? textNoRequests : t('noConversations')}
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={selectedId === conv.id}
              onClick={() => onSelect(conv.id, activeStatus)}
            />
          ))
        )}
      </div>
    </div>
  );
};
