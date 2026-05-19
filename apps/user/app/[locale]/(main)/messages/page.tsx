"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/chat-hooks";
import { useSearchParams } from "next/navigation";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("conversation"));
  const view = searchParams.get("view") === "requests" ? "requests" : "inbox";
  const status = view === "requests" ? "REQUESTED" : "ACTIVE";
  const { data } = useConversations(0, 20, status);
  const conversations = data?.data || [];
  
  const selectedConversation = conversations.find(c => c.id === selectedId) || null;

  return (
    <div className="h-full w-full overflow-hidden border-x border-elevated bg-background">
      <ChatWindow conversation={selectedConversation} />
    </div>
  );
}
