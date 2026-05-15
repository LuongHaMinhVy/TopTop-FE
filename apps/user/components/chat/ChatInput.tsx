"use client";

import { useSendMessage } from "@/hooks/chat-hooks";
import { useState, KeyboardEvent } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";

interface ChatInputProps {
  conversationId: number;
}

export const ChatInput = ({ conversationId }: ChatInputProps) => {
  const t = useTranslations('Chat');
  const [text, setText] = useState("");
  const sendMessage = useSendMessage();

  const handleSend = () => {
    if (!text.trim()) return;

    sendMessage.mutate({
      conversationId,
      type: 'TEXT',
      body: text.trim(),
      clientMessageId: uuidv4(),
    });

    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-elevated rounded-xl px-3 py-2">
      <button className="text-text-secondary hover:text-text-primary p-1">
        <Smile size={22} />
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('inputPlaceholder')}
        className="flex-1 bg-transparent border-none outline-none text-[15px] py-1"
      />
      <button className="text-text-secondary hover:text-text-primary p-1">
        <Paperclip size={20} />
      </button>
      <button 
        onClick={handleSend}
        disabled={!text.trim() || sendMessage.isPending}
        className={`p-2 rounded-full transition-all ${
          text.trim() ? 'text-brand' : 'text-text-muted opacity-50'
        }`}
      >
        <Send size={20} fill={text.trim() ? "currentColor" : "none"} />
      </button>
    </div>
  );
};
