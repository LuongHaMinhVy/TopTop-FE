"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSendLiveMessage, useChatHistory, useLiveSocket, useLiveModeration } from "@/hooks/live-hooks";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Avatar, Input, Button } from "@repo/ui";
import { Send, Trash2, Pin, ShieldBan } from "lucide-react";

interface LiveChatProps {
  livestreamId: number;
  isHost?: boolean;
  focusSignal?: number;
  enableSocket?: boolean;
}

export default function LiveChat({ livestreamId, isHost = false, focusSignal = 0, enableSocket = true }: LiveChatProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { data: history, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatHistory(livestreamId);
  const sendMessage = useSendLiveMessage();
  const { hideMessage, pinMessage, banUser } = useLiveModeration();

  // Socket connection to listen for incoming chat & moderation events
  useLiveSocket(enableSocket ? livestreamId : null);

  // Flatten messages and reverse so newest is at bottom
  const messages = history?.pages.flatMap(p => p.data || []).reverse() || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (focusSignal > 0) {
      inputRef.current?.focus();
    }
  }, [focusSignal]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !currentUser) return;
    
    sendMessage.mutate({
      id: livestreamId,
      data: { message: inputValue.trim() }
    });
    setInputValue("");
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        {hasNextPage && (
          <div className="text-center mb-4">
            <Button variant="ghost" size="sm" onClick={loadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2 group relative">
              <div className="w-8 h-8 shrink-0">
                <Avatar src={msg.sender.avatarUrl || ""} alt={msg.sender.username} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate text-text-muted">
                    {msg.sender.displayName || msg.sender.username}
                  </span>
                  {msg.isPinned && <Pin className="w-3 h-3 text-brand" />}
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
              </div>

              {/* Moderation Controls (Host only) */}
              {isHost && currentUser?.id !== msg.sender.id && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => pinMessage.mutate({ id: livestreamId, messageId: msg.id })}
                      className="p-1 hover:bg-hover rounded"
                      title="Pin Message"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => hideMessage.mutate({ id: livestreamId, messageId: msg.id })}
                      className="p-1 hover:bg-hover rounded text-red-500"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => banUser.mutate({ id: livestreamId, userId: msg.sender.id, reason: "Banned by host" })}
                      className="p-1 hover:bg-hover rounded text-red-500"
                      title="Ban User"
                    >
                      <ShieldBan className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-elevated shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full bg-elevated border-none h-10 px-4"
            disabled={!currentUser}
          />
          <button 
            type="submit" 
            className="rounded-full shrink-0 h-10 w-10 text-brand flex items-center justify-center disabled:opacity-50 hover:bg-hover transition-colors" 
            disabled={!inputValue.trim() || !currentUser || sendMessage.isPending}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
