'use client';

import { useMemo, useState } from 'react';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { CheckCircle2, MessageSquare, Search, Trash2 } from 'lucide-react';
import { RootState } from '@/store/store';
import { useUserVideos } from '@/hooks/video-hooks';
import { getComments, deleteComment } from '@/services/comment-api-service';
import { DocumentTitle } from '@/components/shared/DocumentTitle';
import type { CommentResponse } from '@/types/comment';
import type { Video } from '@/types/video';
import type { ApiResponse } from '@/types/api';

type StudioComment = CommentResponse & {
  video?: Video;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function StudioCommentsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [videoFilter, setVideoFilter] = useState<number | 'ALL'>('ALL');
  const { data: videosResponse, isLoading: loadingVideos } = useUserVideos(user?.id);
  const videos = useMemo(() => videosResponse?.data ?? [], [videosResponse?.data]);

  const commentQueries = useQueries({
    queries: videos.map((video) => ({
      queryKey: ['comments', video.id],
      queryFn: () => getComments(video.id),
      enabled: Boolean(video.id),
      staleTime: 30_000,
    })),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: (_response, commentId) => {
      queryClient.setQueriesData<ApiResponse<CommentResponse[]>>(
        { queryKey: ['comments'] },
        (current) =>
          current?.data
            ? {
                ...current,
                data: current.data.filter((comment) => comment.id !== commentId),
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['user-videos', user?.id] });
    },
  });

  const comments = useMemo<StudioComment[]>(() => {
    return commentQueries
      .flatMap((query, index) => {
        const video = videos[index];
        return (query.data?.data ?? []).map((comment) => ({
          ...comment,
          video,
        }));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [commentQueries, videos]);

  const filteredComments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return comments.filter((comment) => {
      if (videoFilter !== 'ALL' && comment.videoId !== videoFilter) return false;
      if (!keyword) return true;
      return [
        comment.content,
        comment.username,
        comment.author?.displayName,
        comment.video?.title,
        comment.video?.description,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });
  }, [comments, search, videoFilter]);

  const isLoading = loadingVideos || commentQueries.some((query) => query.isLoading);

  const handleDelete = (commentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này không?')) return;
    deleteMutation.mutate(commentId);
  };

  return (
    <>
      <DocumentTitle title="Comments | TopTop Studio" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">TopTop Studio</p>
            <h1 className="mt-1 text-3xl font-black text-text-primary">Bình luận</h1>
            <p className="mt-2 text-sm text-text-secondary">Theo dõi và quản lý bình luận trên toàn bộ video của bạn.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[260px_220px]">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm bình luận, tài khoản, video"
                className="h-11 w-full rounded-lg border border-elevated bg-background pl-10 pr-3 text-sm font-medium text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-text-muted"
              />
            </label>
            <select
              value={videoFilter}
              onChange={(event) => setVideoFilter(event.target.value === 'ALL' ? 'ALL' : Number(event.target.value))}
              className="h-11 rounded-lg border border-elevated bg-background px-3 text-sm font-bold text-text-primary outline-none transition-colors focus:border-text-muted"
            >
              <option value="ALL" className="bg-background text-text-primary opacity-100">Tất cả video</option>
              {videos.map((video) => (
                <option key={video.id} value={video.id} className="bg-background text-text-primary opacity-100">
                  {video.title || video.description || `Video #${video.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tổng bình luận" value={comments.length} />
          <StatCard label="Đang hiển thị" value={filteredComments.length} />
          <StatCard label="Video có bình luận" value={new Set(comments.map((comment) => comment.videoId)).size} />
        </div>

        <section className="overflow-hidden rounded-lg border border-elevated bg-background">
          <div className="flex items-center justify-between border-b border-elevated p-5">
            <div>
              <h2 className="text-lg font-black text-text-primary">Hộp bình luận</h2>
              <p className="text-sm text-text-secondary">Bình luận mới nhất nằm trên cùng</p>
            </div>
            <MessageSquare className="text-text-muted" size={22} />
          </div>

          <div className="divide-y divide-elevated">
            {isLoading ? (
              <div className="grid min-h-[360px] place-items-center text-sm font-semibold text-text-muted">Đang tải bình luận...</div>
            ) : filteredComments.length === 0 ? (
              <div className="grid min-h-[360px] place-items-center px-6 text-center">
                <div>
                  <MessageSquare className="mx-auto mb-4 text-text-muted" size={42} />
                  <p className="text-sm font-bold text-text-primary">Chưa có bình luận phù hợp.</p>
                  <p className="mt-1 text-sm text-text-secondary">Khi có bình luận mới, bạn có thể quản lý ngay tại đây.</p>
                </div>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <article key={comment.id} className="grid gap-4 p-4 transition-colors hover:bg-hover/60 lg:grid-cols-[1fr_220px_auto] lg:items-center">
                  <div className="flex min-w-0 gap-3">
                    <Avatar comment={comment} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-text-primary">{comment.author?.displayName || comment.username}</span>
                        {comment.author?.verified ? <CheckCircle2 className="text-cyan" size={14} /> : null}
                        <span className="text-xs font-medium text-text-muted">@{comment.username}</span>
                        <span className="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 break-words text-sm leading-relaxed text-text-primary">{comment.content}</p>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-lg border border-elevated bg-surface/60 p-3">
                    <p className="truncate text-xs font-bold uppercase text-text-muted">Video</p>
                    <p className="mt-1 truncate text-sm font-semibold text-text-primary">
                      {comment.video?.title || comment.video?.description || `Video #${comment.videoId}`}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {(comment.video?.viewCount ?? 0).toLocaleString()} xem · {(comment.video?.commentCount ?? 0).toLocaleString()} bình luận
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-elevated px-3 text-sm font-bold text-text-secondary transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Xóa
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-elevated bg-background p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-text-primary">{value.toLocaleString()}</p>
    </div>
  );
}

function Avatar({ comment }: { comment: StudioComment }) {
  const src = comment.author?.avatarUrl || comment.userAvatarUrl;
  const label = comment.author?.displayName || comment.username || 'U';
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-elevated bg-surface">
      {src ? (
        <Image src={src} alt={label} fill sizes="40px" className="object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-black text-brand">
          {label[0]?.toUpperCase() ?? 'U'}
        </div>
      )}
    </div>
  );
}
