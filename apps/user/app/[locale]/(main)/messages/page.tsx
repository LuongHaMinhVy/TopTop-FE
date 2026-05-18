"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/chat-hooks";
import { useSearchParams } from "next/navigation";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("conversation"));
  const { data } = useConversations();
  const conversations = data?.data || [];
  
  const selectedConversation = conversations.find(c => c.id === selectedId) || null;

  return (
    <div className="h-full w-full overflow-hidden border-x border-elevated bg-background">
      <ChatWindow conversation={selectedConversation} />
    </div>
  );
}
