"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useConversations } from "@/hooks/chat-hooks";
import { useSearchParams } from "next/navigation";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("conversation")) || null;
  const view = searchParams.get("view") === "requests" ? "requests" : "inbox";
  const status = view === "requests" ? "REQUESTED" : "ACTIVE";
  
  const { data } = useConversations(0, 50, status); // Fetch first 50 to cover most cases
  const conversations = data?.data || [];
  
  const selectedConversation = selectedId
    ? conversations.find((c) => c.id === selectedId) || null
    : null;

  return (
    <div className="h-full w-full overflow-hidden border-x border-elevated bg-background">
      <DocumentTitle title="Messages | TopTop" />
      <ChatWindow conversation={selectedConversation} />
    </div>
  );
}
