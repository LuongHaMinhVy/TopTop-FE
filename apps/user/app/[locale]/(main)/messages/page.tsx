"use client";

import { useState } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/chat-hooks";

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data } = useConversations();
  const conversations = data?.data || [];
  
  const selectedConversation = conversations.find(c => c.id === selectedId) || null;

  return (
    <div className="flex h-full w-full overflow-hidden border-x border-elevated">
      {/* List Panel */}
      <div className="w-[350px] flex-shrink-0 border-r border-elevated bg-background h-full">
        <ConversationList selectedId={selectedId || undefined} onSelect={setSelectedId} />
      </div>

      {/* Chat Detail Panel */}
      <div className="flex-1 bg-background h-full overflow-hidden">
        <ChatWindow conversation={selectedConversation} />
      </div>
    </div>
  );
}
