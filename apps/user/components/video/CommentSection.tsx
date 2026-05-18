"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAddCommentMutation,
  useAddReplyMutation,
  useComments,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useReplies,
} from "@/hooks/comment-hooks";
import { Avatar, Button } from "@repo/ui";
import { Flag, Heart, MessageCircle, MoreHorizontal, Send, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import type { CommentResponse } from "@/types/comment";
import { ReportModal } from "@/components/report/ReportModal";

interface Props {
  videoId: number;
  allowComments?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  showHeader?: boolean;
  className?: string;
}

interface ReplyTarget {
  videoId: number;
  commentId: number;
  username: string;
}

export default function CommentSection({
  videoId,
  allowComments = true,
  onClose,
  embedded = false,
  showHeader = true,
  className = "",
}: Props) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const { data: commentsData, isLoading, isError, refetch } = useComments(videoId);
  const addComment = useAddCommentMutation();
  const addReply = useAddReplyMutation(videoId);
  const deleteComment = useDeleteCommentMutation(videoId);
  const likeComment = useLikeCommentMutation(videoId);
  const [draft, setDraft] = useState({ videoId, content: "" });
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const commentsListRef = useRef<HTMLDivElement | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const comments = commentsData?.data || [];
  const content = draft.videoId === videoId ? draft.content : "";
  const activeReplyTarget = replyTarget?.videoId === videoId ? replyTarget : null;
  const isSubmitting = addComment.isPending || addReply.isPending;

  useEffect(() => {
    commentsListRef.current?.scrollTo({ top: 0 });
  }, [videoId]);

  const requireLogin = () => {
    if (currentUser) return true;
    dispatch(openAuthModal("login"));
    return false;
  };

  const handleSend = () => {
    const nextContent = content.trim();
    if (!nextContent || !requireLogin() || !allowComments) return;

    if (activeReplyTarget) {
      addReply.mutate(
        { commentId: activeReplyTarget.commentId, content: nextContent },
        {
          onSuccess: () => {
            setDraft({ videoId, content: "" });
            setReplyTarget(null);
          },
        },
      );
      return;
    }

    addComment.mutate(
      { videoId, content: nextContent },
      {
        onSuccess: () => setDraft({ videoId, content: "" }),
      },
    );
  };

  return (
    <div
      className={`flex h-full flex-col bg-background ${
        embedded ? "w-full" : "w-full border-l border-elevated/30 sm:w-[400px] animate-in slide-in-from-right duration-300"
      } ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b border-elevated/30 p-4">
          <h2 className="font-bold text-[16px]">
            {comments.length} {t("video.comments")}
          </h2>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-elevated rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {isLoading ? (
          <CommentSkeleton />
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
            <p className="text-[14px]">{t("video.commentLoadError")}</p>
            <button type="button" onClick={() => refetch()} className="text-[14px] font-bold text-brand">
              {t("video.retry")}
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="text-[14px]">{t("video.noComments")}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(target) => {
                if (!requireLogin()) return;
                setReplyTarget({ videoId, commentId: target.id, username: commentUsername(target) });
              }}
              onDelete={(commentId) => deleteComment.mutate(commentId)}
              onReport={(commentId) => {
                if (!requireLogin()) return;
                setReportTargetId(commentId);
              }}
              onLike={(target) => {
                if (!requireLogin()) return;
                likeComment.mutate({ commentId: target.id, liked: Boolean(target.liked) });
              }}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-elevated/30 bg-background/80 backdrop-blur-md">
        {!allowComments ? (
          <p className="text-center text-[14px] text-text-muted">{t("video.commentsDisabled")}</p>
        ) : currentUser ? (
          <div className="space-y-2">
            {activeReplyTarget && (
              <div className="flex items-center justify-between rounded-lg bg-elevated/30 px-3 py-2 text-[13px] text-text-secondary">
                <span>{t("video.replyingTo", { username: activeReplyTarget.username })}</span>
                <button type="button" onClick={() => setReplyTarget(null)} className="font-bold text-white">
                  {t("video.cancelReply")}
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 bg-elevated/30 rounded-2xl p-2 border border-elevated/50 focus-within:border-brand/30 transition-all">
              <textarea
                value={content}
                onChange={(e) => setDraft({ videoId, content: e.target.value.slice(0, 2000) })}
                placeholder={
                  activeReplyTarget
                    ? t("video.replyPlaceholder", { username: activeReplyTarget.username })
                    : t("video.commentPlaceholder")
                }
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-1.5 px-2 text-[14px] max-h-24 no-scrollbar"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!content.trim() || isSubmitting}
                className={`p-2 rounded-full transition-all ${content.trim() ? "text-brand bg-brand/10 hover:bg-brand/20" : "text-text-muted"}`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-2">
            <p className="text-[14px] text-text-muted mb-2">{t("video.loginToComment")}</p>
            <Button size="sm" variant="outline" className="w-full" onClick={() => dispatch(openAuthModal("login"))}>
              {t("auth.login")}
            </Button>
          </div>
        )}
      </div>

      {reportTargetId !== null && (
        <ReportModal
          isOpen={reportTargetId !== null}
          onClose={() => setReportTargetId(null)}
          targetType="COMMENT"
          targetId={reportTargetId}
        />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  onReport,
  onLike,
}: {
  comment: CommentResponse;
  onReply: (comment: CommentResponse) => void;
  onDelete: (commentId: number) => void;
  onReport: (commentId: number) => void;
  onLike: (comment: CommentResponse) => void;
}) {
  const t = useTranslations();
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { data: repliesData, isLoading: isLoadingReplies } = useReplies(showReplies ? comment.id : undefined);
  const replies = repliesData?.data || [];

  return (
    <div className="flex gap-3 group">
      <Avatar src={commentAvatar(comment)} alt={commentUsername(comment)} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[13px] hover:underline cursor-pointer">@{commentUsername(comment)}</span>
              <span className="text-[12px] text-text-muted">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
              </span>
            </div>
            <p className={`text-[14px] leading-snug ${comment.deleted ? "italic text-text-muted" : ""}`}>
              {comment.deleted ? t("video.commentDeleted") : comment.content}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onLike(comment)}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${comment.liked ? "text-brand" : "text-text-muted hover:text-white"}`}
          >
            <Heart size={16} className={comment.liked ? "fill-current" : ""} />
            {comment.likeCount ? comment.likeCount : ""}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-4 text-[12px] font-semibold text-text-muted">
          <button className="hover:text-text-secondary transition-colors" onClick={() => onReply(comment)}>
            {t("video.reply")}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((value) => !value)}
              className="grid size-6 place-items-center rounded-full hover:bg-elevated"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-7 z-20 min-w-32 overflow-hidden rounded-lg border border-white/10 bg-[#222] py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onReport(comment.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-white/10"
                >
                  <Flag size={14} />
                  {t("video.report")}
                </button>
                {comment.canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(comment.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-brand hover:bg-white/10"
                  >
                    <Trash2 size={14} />
                    {t("video.deleteComment")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {Boolean(comment.replyCount) && (
          <button
            type="button"
            onClick={() => setShowReplies((value) => !value)}
            className="mt-3 text-[12px] font-bold text-text-secondary hover:text-white"
          >
            {showReplies
              ? t("video.hideReplies")
              : t("video.loadMoreReplies", { count: comment.replyCount ?? 0 })}
          </button>
        )}

        {showReplies && (
          <div className="mt-4 space-y-4 border-l border-white/10 pl-4">
            {isLoadingReplies ? (
              <CommentSkeleton compact />
            ) : (
              replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  onReport={onReport}
                  onLike={onLike}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(compact ? 2 : 5)].map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-elevated rounded w-1/3" />
            <div className="h-3 bg-elevated rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function commentUsername(comment: CommentResponse) {
  return comment.author?.username || comment.username;
}

function commentAvatar(comment: CommentResponse) {
  return comment.author?.avatarUrl || comment.userAvatarUrl;
}
