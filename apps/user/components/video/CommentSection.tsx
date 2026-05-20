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
import {
  Flag,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import type { CommentResponse } from "@/types/comment";
import { ReportModal } from "@/components/report/ReportModal";
import { useUploadMediaMutation } from "@/hooks/media-hooks";
import { useConversations } from "@/hooks/chat-hooks";
import { useFollowingList } from "@/hooks/user-hooks";
import type { UserInfo } from "@/types/user";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";

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

const EMOJIS = [
  "😂",
  "🥰",
  "😍",
  "😭",
  "😅",
  "😳",
  "🔥",
  "❤️",
  "👏",
  "💀",
  "✨",
  "😎",
];
const COMMENT_WORD_LIMIT = 2000;

function limitWords(value: string, limit: number) {
  const parts = value.match(/\S+\s*/g);
  if (!parts || parts.length <= limit) return value;
  return parts.slice(0, limit).join("").trimEnd();
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
  const {
    data: commentsData,
    isLoading,
    isError,
    refetch,
  } = useComments(videoId);
  const addComment = useAddCommentMutation();
  const addReply = useAddReplyMutation(videoId);
  const deleteComment = useDeleteCommentMutation(videoId);
  const likeComment = useLikeCommentMutation(videoId);
  const uploadMedia = useUploadMediaMutation();
  const [draft, setDraft] = useState({ videoId, content: "" });
  const [imageDraft, setImageDraft] = useState<{
    videoId: number;
    file: File;
    previewUrl: string;
  } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const debouncedMentionQuery = useDebounce(mentionQuery, 250);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const commentsListRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { data: conversationsData } = useConversations(0, 20, "ACTIVE");
  const { data: followingData } = useFollowingList(Boolean(currentUser));

  const comments = commentsData?.data || [];
  const content = draft.videoId === videoId ? draft.content : "";
  const activeImageDraft = imageDraft?.videoId === videoId ? imageDraft : null;
  const activeReplyTarget =
    replyTarget?.videoId === videoId ? replyTarget : null;
  const isSubmitting =
    addComment.isPending || addReply.isPending || uploadMedia.isPending;
  const chatMentionUsers: UserInfo[] = (conversationsData?.data ?? [])
    .map((conversation) => conversation.targetUser)
    .filter(Boolean)
    .map((user) => ({
      id: user!.userId,
      username: user!.username,
      nickname: user!.displayName,
      avatarUrl: user!.avatarUrl,
      roles: [],
    }));
  const followingUsers = followingData?.data ?? [];
  const mentionUsers = (
    debouncedMentionQuery
      ? followingUsers.filter(
          (user) =>
            user.username
              .toLowerCase()
              .includes(debouncedMentionQuery.toLowerCase()) ||
            (user.nickname ?? "")
              .toLowerCase()
              .includes(debouncedMentionQuery.toLowerCase()),
        )
      : chatMentionUsers
  ).slice(0, 6);

  useEffect(() => {
    commentsListRef.current?.scrollTo({ top: 0 });
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (imageDraft) {
        URL.revokeObjectURL(imageDraft.previewUrl);
      }
    };
  }, [imageDraft]);

  const requireLogin = () => {
    if (currentUser) return true;
    dispatch(openAuthModal("login"));
    return false;
  };

  const updateContent = (nextContent: string) => {
    const limitedContent = limitWords(nextContent, COMMENT_WORD_LIMIT);
    setDraft({ videoId, content: limitedContent });
    const match = limitedContent.match(/(?:^|\s)@([\w.]*)$/);
    setMentionOpen(Boolean(match));
    setMentionQuery(match?.[1] ?? "");
  };

  const appendEmoji = (emoji: string) => {
    updateContent(`${content}${emoji}`);
    setEmojiOpen(false);
  };

  const selectMention = (user: UserInfo) => {
    const nextContent = content.replace(/(?:^|\s)@[\w.]*$/, (match) => {
      const prefix = match.startsWith(" ") ? " " : "";
      return `${prefix}@${user.username} `;
    });
    updateContent(nextContent);
    setMentionOpen(false);
  };

  const handleImageChange = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (imageDraft) URL.revokeObjectURL(imageDraft.previewUrl);
    setImageDraft({ videoId, file, previewUrl: URL.createObjectURL(file) });
  };

  const handleSend = async () => {
    const nextContent = content.trim();
    if ((!nextContent && !activeImageDraft) || !requireLogin() || !allowComments)
      return;

    let mediaUrl: string | null = null;
    if (activeImageDraft) {
      const uploadResponse = await uploadMedia.mutateAsync({
        file: activeImageDraft.file,
        context: "comment",
      });
      mediaUrl = uploadResponse.data?.url ?? null;
    }

    if (activeReplyTarget) {
      addReply.mutate(
        {
          commentId: activeReplyTarget.commentId,
          content: nextContent,
          mediaUrl,
          mediaType: mediaUrl ? "IMAGE" : null,
        },
        {
          onSuccess: () => {
            setDraft({ videoId, content: "" });
            if (activeImageDraft) URL.revokeObjectURL(activeImageDraft.previewUrl);
            setImageDraft(null);
            setReplyTarget(null);
          },
        },
      );
      return;
    }

    addComment.mutate(
      {
        videoId,
        content: nextContent,
        mediaUrl,
        mediaType: mediaUrl ? "IMAGE" : null,
      },
      {
        onSuccess: () => {
          setDraft({ videoId, content: "" });
          if (activeImageDraft) URL.revokeObjectURL(activeImageDraft.previewUrl);
          setImageDraft(null);
        },
      },
    );
  };

  return (
    <div
      className={`flex h-full flex-col bg-background ${
        embedded
          ? "w-full"
          : "w-full border-l border-elevated/30 sm:w-[400px] animate-in slide-in-from-right duration-300"
      } ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b border-elevated/30 p-4">
          <h2 className="font-bold text-[16px]">
            {comments.length} {t("video.comments")}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-elevated rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div
        ref={commentsListRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {isLoading ? (
          <CommentSkeleton />
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
            <p className="text-[14px]">{t("video.commentLoadError")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[14px] font-bold text-brand"
            >
              {t("video.retry")}
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="text-[14px]">
              {allowComments
                ? t("video.noComments")
                : t("video.commentsDisabled")}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(target) => {
                if (!requireLogin()) return;
                setReplyTarget({
                  videoId,
                  commentId: target.id,
                  username: commentUsername(target),
                });
              }}
              onDelete={(commentId) => deleteComment.mutate(commentId)}
              onReport={(commentId) => {
                if (!requireLogin()) return;
                setReportTargetId(commentId);
              }}
              onLike={(target) => {
                if (!requireLogin()) return;
                likeComment.mutate({
                  commentId: target.id,
                  liked: Boolean(target.liked),
                });
              }}
            />
          ))
        )}
      </div>

      {allowComments && (
        <div className="p-4 border-t border-elevated/30 bg-background/80 backdrop-blur-md">
          {currentUser ? (
            <div className="space-y-2">
              {activeReplyTarget && (
                <div className="flex items-center justify-between rounded-lg bg-elevated/30 px-3 py-2 text-[13px] text-text-secondary">
                  <span>
                    {t("video.replyingTo", {
                      username: activeReplyTarget.username,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="font-bold text-text-primary"
                  >
                    {t("video.cancelReply")}
                  </button>
                </div>
              )}
              {activeImageDraft && (
                <div className="relative w-24 overflow-hidden rounded-xl border border-elevated bg-elevated">
                  <Image
                    src={activeImageDraft.previewUrl}
                    alt="Ảnh bình luận"
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(activeImageDraft.previewUrl);
                      setImageDraft(null);
                    }}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/80 text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="relative flex items-end gap-1 bg-elevated/30 rounded-2xl p-2 border border-elevated/50 focus-within:border-brand/30 transition-all">
                {mentionOpen && mentionUsers.length > 0 && (
                  <div className="absolute bottom-full left-2 mb-2 w-64 overflow-hidden rounded-xl border border-elevated bg-background shadow-2xl">
                    {mentionUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectMention(user)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hover"
                      >
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">
                            {user.nickname || user.username}
                          </p>
                          <p className="truncate text-[12px] text-text-muted">
                            @{user.username}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {emojiOpen && (
                  <div className="absolute bottom-full left-2 mb-2 grid grid-cols-6 gap-1 rounded-xl border border-elevated bg-background p-2 shadow-2xl">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => appendEmoji(emoji)}
                        className="grid size-8 place-items-center rounded-lg hover:bg-hover"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setEmojiOpen((value) => !value)}
                  className="p-1.5 text-text-secondary hover:text-text-primary"
                >
                  <Smile size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 text-text-secondary hover:text-text-primary"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
                <textarea
                  value={content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder={
                    activeReplyTarget
                      ? t("video.replyPlaceholder", {
                          username: activeReplyTarget.username,
                        })
                      : t("video.commentPlaceholder")
                  }
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none py-1.5 px-2 text-[14px] max-h-24 no-scrollbar"
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
                  disabled={(!content.trim() && !activeImageDraft) || isSubmitting}
                  className={`p-2 rounded-full transition-all ${content.trim() || activeImageDraft ? "text-brand bg-brand/10 hover:bg-brand/20" : "text-text-muted"}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-2">
              <p className="text-[14px] text-text-muted mb-2">
                {t("video.loginToComment")}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => dispatch(openAuthModal("login"))}
              >
                {t("auth.login")}
              </Button>
            </div>
          )}
        </div>
      )}

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
  const [visibleReplyCount, setVisibleReplyCount] = useState(0);
  const { data: repliesData, isLoading: isLoadingReplies } = useReplies(
    visibleReplyCount > 0 ? comment.id : undefined,
  );
  const replies = repliesData?.data || [];
  const totalReplies = comment.replyCount ?? 0;
  const visibleReplies = replies.slice(0, visibleReplyCount);
  const remainingReplies = Math.max(0, totalReplies - visibleReplyCount);
  const nextReplyBatchCount = Math.min(4, remainingReplies);

  const handleShowMoreReplies = () => {
    setVisibleReplyCount((current) => {
      return Math.min(totalReplies, current + 4);
    });
  };

  const handleHideReplies = () => {
    setVisibleReplyCount(0);
  };

  return (
    <div className="flex gap-3 group">
      <Avatar
        src={commentAvatar(comment)}
        alt={commentUsername(comment)}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[13px] hover:underline cursor-pointer">
                @{commentUsername(comment)}
              </span>
              <span className="text-[12px] text-text-muted">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>
            <p
              className={`text-[14px] leading-snug ${comment.deleted ? "italic text-text-muted" : ""}`}
            >
              {comment.deleted ? t("video.commentDeleted") : comment.content}
            </p>
            {!comment.deleted &&
              comment.mediaUrl &&
              comment.mediaType === "IMAGE" && (
                <Image
                  src={comment.mediaUrl}
                  alt="Comment attachment"
                  className="mt-2 max-h-56 max-w-[220px] rounded-xl object-cover"
                />
              )}
          </div>

          <button
            type="button"
            onClick={() => onLike(comment)}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${comment.liked ? "text-brand" : "text-text-muted hover:text-text-primary"}`}
          >
            <Heart size={16} className={comment.liked ? "fill-current" : ""} />
            {comment.likeCount ? comment.likeCount : ""}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-4 text-[12px] font-semibold text-text-muted">
          <button
            className="hover:text-text-secondary transition-colors"
            onClick={() => onReply(comment)}
          >
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
              <div className="absolute left-0 top-7 z-20 min-w-32 overflow-hidden rounded-lg border border-elevated bg-background py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onReport(comment.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-hover"
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-brand hover:bg-hover"
                  >
                    <Trash2 size={14} />
                    {t("video.deleteComment")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {totalReplies > 0 && visibleReplyCount === 0 && (
          <button
            type="button"
            onClick={handleShowMoreReplies}
            className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-text-secondary hover:text-text-primary"
          >
            <span className="h-px w-8 bg-text-muted" />
            Xem {totalReplies} câu trả lời ⌄
          </button>
        )}

        {visibleReplyCount > 0 && (
          <div className="mt-4 space-y-4 pl-4">
            {isLoadingReplies ? (
              <CommentSkeleton compact />
            ) : (
              visibleReplies.map((reply) => (
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

            <div className="flex items-center gap-4 text-[12px] font-bold text-text-secondary">
              {remainingReplies > 0 && (
                <button
                  type="button"
                  onClick={handleShowMoreReplies}
                  className="inline-flex items-center gap-2 hover:text-text-primary"
                >
                  <span className="h-px w-8 bg-text-muted" />
                  Xem thêm {nextReplyBatchCount}⌄
                </button>
              )}
              <button
                type="button"
                onClick={handleHideReplies}
                className="inline-flex items-center gap-1 hover:text-text-primary"
              >
                Ẩn ⌃
              </button>
            </div>
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
