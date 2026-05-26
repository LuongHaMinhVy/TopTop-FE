"use client";

import { X, Search, Link as LinkIcon, Code2, Repeat2, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useConversations, useShareVideoToChats } from "@/hooks/chat-hooks";
import { useFollowingList } from "@/hooks/user-hooks";
import type { UserInfo } from "@/types/user"; 
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onRepost?: () => void;
  onRemoveRepost?: () => void;
  isReposted?: boolean;
  simplified?: boolean;
  videoId?: number;
  showRepost?: boolean;
}

export function ShareModal({
  isOpen,
  onClose,
  onCopyLink,
  onRepost,
  onRemoveRepost,
  isReposted,
  simplified = false,
  videoId,
  showRepost = true,
}: ShareModalProps) {
  const { mutate: shareVideoToChats, isPending: isSharing } = useShareVideoToChats();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  // Fetch active conversations
  const { data: convRes, isLoading: isLoadingConv, refetch: refetchConversations } = useConversations(0, 20, 'ACTIVE');
  
  const { data: followingRes, isLoading: isLoadingFollowing, refetch: refetchFollowing } = useFollowingList(isOpen && !simplified);
  
  const shareTargets = useMemo(() => {
    const targets = new Map<number, UserInfo>();
    const addTarget = (target?: UserInfo) => {
      if (!target || target.id === currentUserId || targets.has(target.id)) return;
      targets.set(target.id, target);
    };
    
    // 1. Add from active chats
    if (convRes?.data) {
      convRes.data.forEach(conv => {
        if (conv.targetUser) {
          addTarget({
            id: conv.targetUser.userId,
            username: conv.targetUser.username,
            nickname: conv.targetUser.displayName,
            avatarUrl: conv.targetUser.avatarUrl,
          } as UserInfo);
        }
      });
    }

    // 2. Add from following. Friends are included here because a friend is a mutual follow.
    if (followingRes?.data) {
      followingRes.data.forEach(f => {
        addTarget(f);
      });
    }

    return Array.from(targets.values());
  }, [convRes, currentUserId, followingRes]);

  const isLoading = isLoadingConv || isLoadingFollowing;

  const filtered = searchQuery.trim()
    ? shareTargets.filter(
        (f) =>
          f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.nickname ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : shareTargets;

  useEffect(() => {
    if (!isOpen) return;
    refetchConversations();
    if (!simplified) {
      refetchFollowing();
    }

    const resetTimer = window.setTimeout(() => {
      setSelectedIds(new Set());
      setMessage("");
      setSendError("");
      setSearchQuery("");
      setShowSearch(false);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [isOpen, refetchConversations, refetchFollowing, simplified]);

  // Focus search when toggled on
  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  if (!isOpen) return null;

  const toggleFriend = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    setSendError("");
    if (!videoId) {
      setSendError("Không tìm thấy video để chia sẻ.");
      return;
    }
    if (selectedIds.size === 0) {
      setSendError("Hãy chọn người nhận.");
      return;
    }

    shareVideoToChats(
      { userIds: Array.from(selectedIds), videoId, message },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          setSendError(error instanceof Error ? error.message : "Không thể chia sẻ video. Vui lòng thử lại.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="modal-opacity-solid relative flex w-full max-w-[540px] flex-col rounded-t-[20px] bg-background text-text-primary shadow-2xl sm:rounded-[16px] border border-elevated animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        data-modal-panel
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-elevated">
          {/* Search toggle */}
          {!simplified ? (
            showSearch ? (
              <div className="flex flex-1 items-center gap-2 mr-3">
                <Search className="size-4 text-text-muted shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-[15px] text-text-primary placeholder-text-muted outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="grid size-8 place-items-center rounded-full hover:bg-hover transition"
              >
                <Search className="size-5 text-text-secondary" />
              </button>
            )
          ) : (
            <div className="size-8" />
          )}

          <h2 className="shrink-0 text-[17px] font-bold text-text-primary">Chia sẻ đến</h2>

          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-elevated hover:bg-hover transition"
          >
            <X className="size-5 text-text-primary" />
          </button>
        </div>

        <div className="flex flex-col">
          {/* ── Friends row ─────────────────────────────── */}
          {!simplified && (
            <div className="border-b border-elevated">
              {isLoading ? (
                /* Skeleton */
                <div className="flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
                      <div className="size-[60px] rounded-full bg-elevated animate-pulse" />
                      <div className="h-3 w-14 rounded bg-elevated animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="flex overflow-x-auto px-4 py-4 no-scrollbar gap-4">
                  {filtered.map((friend) => {
                    const isSelected = selectedIds.has(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className="flex flex-col items-center gap-2 cursor-pointer min-w-[72px]"
                        onClick={() => toggleFriend(friend.id)}
                      >
                        <div className="relative">
                          <div className="relative size-[60px] rounded-full overflow-hidden bg-elevated">
                            {friend.avatarUrl ? (
                              <Image
                                src={friend.avatarUrl}
                                alt={friend.nickname ?? friend.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center bg-elevated text-text-primary text-[20px] font-bold">
                                {(friend.nickname ?? friend.username).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-[3px] border-background bg-brand">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] font-medium text-text-primary text-center line-clamp-2 leading-tight max-w-[72px]">
                          {friend.nickname ?? friend.username}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-6 py-5 text-center text-[13px] text-text-muted">
                  {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè để chia sẻ"}
                </p>
              )}
            </div>
          )}

          {/* ── Actions row ─────────────────────────────── */}
          {selectedIds.size === 0 && (
            <div className="flex overflow-x-auto px-4 py-4 no-scrollbar gap-4">
              {/* Repost / Remove Repost */}
            {showRepost && (isReposted ? (
              <ActionIcon
                color="bg-elevated"
                label="Xóa video đăng lại"
                badge={
                  <div className="absolute bottom-0 right-0 grid size-5 place-items-center rounded-full bg-background text-text-primary">
                    <X className="size-3.5 stroke-[4]" />
                  </div>
                }
                onClick={() => { onRemoveRepost?.(); onClose(); }}
                icon={<Repeat2 className="size-8 text-yellow-400" />}
              />
            ) : (
              <ActionIcon
                color="bg-elevated"
                label="Đăng lại"
                onClick={() => { onRepost?.(); onClose(); }}
                icon={<Repeat2 className="size-8 text-yellow-400" />}
              />
            ))}

            {/* Copy Link */}
            <ActionIcon
              color="bg-[#8b45f7]"
              label="Copy"
              onClick={() => { onCopyLink(); onClose(); }}
              icon={<LinkIcon className="size-8 text-white" />}
            />

            {!simplified && (
              <>
                {/* WhatsApp */}
                <ActionIcon
                  color="bg-[#25d366]"
                  label="WhatsApp"
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                    </svg>
                  }
                />

                {/* Embed */}
                <ActionIcon
                  color="bg-[#1da1f2]"
                  label="Nhúng"
                  icon={<Code2 className="size-8 text-white" />}
                />

                {/* Facebook */}
                <ActionIcon
                  color="bg-[#1877f2]"
                  label="Facebook"
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  }
                />
              </>
            )}
            </div>
          )}

          {/* ── Send Message ───────────────────────────── */}
          {!simplified && selectedIds.size > 0 && (
            <div className="px-4 pb-4 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-elevated px-4 py-2.5">
                <input
                  type="text"
                  placeholder="Viết một tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  className="flex-1 bg-transparent text-[14px] text-text-primary placeholder-text-muted outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={isSharing}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-white transition hover:bg-brand/90 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSharing ? "Đang gửi..." : "Gửi"}
                  {!isSharing && <ArrowRight className="size-3.5" />}
                  <span className="rounded-full bg-background/25 px-1.5 py-0.5 text-[11px]">
                    {selectedIds.size}
                  </span>
                </button>
              </div>
              {sendError && (
                <p className="mt-2 text-[12px] font-medium text-brand">{sendError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionIcon({
  color,
  label,
  icon,
  badge,
  onClick,
}: {
  color: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 min-w-[72px] group"
      onClick={onClick}
    >
      <div className={`relative grid size-[60px] place-items-center rounded-full ${color} transition-transform group-hover:scale-105 group-active:scale-95`}>
        {icon}
        {badge}
      </div>
      <span className="text-[12px] font-medium text-text-secondary text-center leading-tight">{label}</span>
    </button>
  );
}
