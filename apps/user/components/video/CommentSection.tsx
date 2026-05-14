"use client";

import { useState } from "react";
import { useComments, useAddCommentMutation, useDeleteCommentMutation } from "@/hooks/comment-hooks";
import { Avatar, Button } from "@repo/ui";
import { Send, Trash2, MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Props {
  videoId: number;
  onClose?: () => void;
}

export default function CommentSection({ videoId, onClose }: Props) {
  const t = useTranslations();
  const { data: commentsData, isLoading } = useComments(videoId);
  const addComment = useAddCommentMutation();
  const deleteComment = useDeleteCommentMutation(videoId);
  const [content, setContent] = useState("");
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const comments = commentsData?.data || [];

  const handleSend = () => {
    if (!content.trim()) return;
    addComment.mutate({ videoId, content }, {
      onSuccess: () => setContent("")
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-elevated/30 w-full sm:w-[400px] animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-elevated/30">
        <h2 className="font-bold text-[16px]">{comments.length} {t('video.comments')}</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-elevated rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-elevated" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-elevated rounded w-1/3" />
                  <div className="h-3 bg-elevated rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="text-[14px]">{t('video.noComments')}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar src={comment.userAvatarUrl} alt={comment.username} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[13px] hover:underline cursor-pointer">@{comment.username}</span>
                  <span className="text-[12px] text-text-muted">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                <p className="text-[14px] leading-snug">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button className="text-[12px] font-semibold text-text-muted hover:text-text-secondary transition-colors">
                    {t('video.reply')}
                  </button>
                  {currentUser?.id === comment.userId && (
                    <button 
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="text-[12px] font-semibold text-brand/60 hover:text-brand transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-elevated/30 bg-background/80 backdrop-blur-md">
        {currentUser ? (
          <div className="flex items-end gap-2 bg-elevated/30 rounded-2xl p-2 border border-elevated/50 focus-within:border-brand/30 transition-all">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('video.commentPlaceholder')}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-1.5 px-2 text-[14px] max-h-24 no-scrollbar"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!content.trim() || addComment.isPending}
              className={`p-2 rounded-full transition-all ${content.trim() ? 'text-brand bg-brand/10 hover:bg-brand/20' : 'text-text-muted'}`}
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div className="text-center p-2">
            <p className="text-[14px] text-text-muted mb-2">{t('video.loginToComment')}</p>
            <Button size="sm" variant="outline" className="w-full">{t('auth.login')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
