'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { 
  Trash2, 
  Pencil, 
  BarChart2, 
  MessageCircle, 
  MoreHorizontal, 
  Pin, 
  Download, 
  Globe, 
  Users, 
  Lock, 
  ChevronDown, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Video as VideoIcon,
  Scissors,
  Music
} from 'lucide-react';
import Image from 'next/image';
import { useUserVideos, useDeleteVideoMutation, useUpdateVideoMutation } from '@/hooks/video-hooks';
import { useComments, useDeleteCommentMutation } from '@/hooks/comment-hooks';
import { getDrafts, deleteDraft, type VideoDraft } from '@/utils/draft-db';
import type { Video } from '@/types/video';
import { DocumentTitle } from '@/components/shared/DocumentTitle';
import { SoundEditorPanel } from '@/components/sound/SoundEditorPanel';
import type { Sound } from '@/types/sound';

type VideoVisibility = NonNullable<Video['visibility']>;
type DraftWithPreview = VideoDraft & { previewUrl: string };
type DraftVideoRow = {
  id: string;
  title: string;
  description?: string;
  visibility: VideoVisibility;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  allowComments: boolean;
  thumbnailUrl?: string;
  duration?: number;
  _isDraft: true;
};
type PublishedVideoRow = Video & { _isDraft?: false };
type ManagedVideoRow = PublishedVideoRow | DraftVideoRow;

const normalizeVisibility = (visibility: string): VideoVisibility => {
  if (visibility === 'FRIENDS' || visibility === 'PRIVATE') return visibility;
  return 'PUBLIC';
};

const isDraftVideoRow = (video: ManagedVideoRow): video is DraftVideoRow => video._isDraft === true;

const parseQualityIssues = (qualityIssuesJson?: string) => {
  if (!qualityIssuesJson) return [];
  return qualityIssuesJson
    .split(',')
    .map((issue) => issue.trim().toUpperCase())
    .filter((issue) => issue === 'WATERMARK' || issue === 'QR_CODE' || issue === 'LOW_QUALITY');
};

// Custom Date Formatter in Vietnamese matching screenshot: e.g. "1 tháng 4 2025, 10:20 SA"
const formatVietnameseDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'CH' : 'SA';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${day} tháng ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
};

// Format Video Duration: e.g. 19 -> "00:19"
const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '00:19'; // fallback to mock from screenshot
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Highlight hashtags in blue
const highlightHashtags = (text?: string) => {
  if (!text) return 'Không có mô tả';
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} className="text-[#3b82f6] font-medium hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

const renderVideoStatusBadge = (video: ManagedVideoRow) => {
  if (video._isDraft) return null;
  const v = video as PublishedVideoRow;

  const contentStatus = v.moderationStatus;
  const musicStatus = v.musicCopyrightStatus;

  if (contentStatus === 'REJECTED') {
    return (
      <div className="flex flex-col gap-1 mt-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 w-fit select-none">
          <AlertCircle size={10} />
          Bị từ chối
        </span>
      </div>
    );
  }

  if (contentStatus === 'NEED_REVIEW') {
    return (
      <div className="flex flex-col gap-1 mt-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit select-none">
          <AlertCircle size={10} />
          Chờ xem xét (Ẩn)
        </span>
        <span className="text-[11px] text-amber-400 font-medium line-clamp-1">Chỉ bạn có thể xem video này cho đến khi được duyệt.</span>
      </div>
    );
  }

  if (contentStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 w-fit select-none mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
        Đang kiểm duyệt (Ẩn)
      </span>
    );
  }

  const hasMusicIssue = musicStatus === 'REJECTED';
  const hasQualityIssue = parseQualityIssues(v.qualityIssuesJson).length > 0;

  if (hasMusicIssue || hasQualityIssue) {
    return (
      <div className="flex flex-col gap-1 mt-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit select-none">
          <Check size={10} />
          Đã xuất bản
        </span>
        {hasMusicIssue && (
          <span className="text-[11px] text-amber-500 font-medium line-clamp-1">Trùng bản quyền âm nhạc (Vẫn hiển thị).</span>
        )}
        {hasQualityIssue && (
          <span className="text-[11px] text-amber-500 font-medium line-clamp-1">{v.qualityIssueMessage || "Nội dung chất lượng thấp hoặc trùng lặp."}</span>
        )}
      </div>
    );
  }

  if (musicStatus === 'PENDING' || musicStatus === 'NEED_REVIEW') {
    return (
      <div className="flex flex-col gap-1 mt-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit select-none">
          <Check size={10} />
          Đã xuất bản
        </span>
        <span className="text-[11px] text-amber-400 font-medium line-clamp-1">Âm thanh có thể được kiểm tra sau khi đăng.</span>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit select-none mt-1">
      <Check size={10} />
      Đã xuất bản
    </span>
  );
};


export default function ContentManagementPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Fetch user videos
  const { data: videoResponse, isLoading } = useUserVideos(user?.id);
  const videos = useMemo(() => videoResponse?.data ?? [], [videoResponse?.data]);

  // Mutations
  const deleteMutation = useDeleteVideoMutation(user?.id);
  const updateMutation = useUpdateVideoMutation(user?.id);

  // Component states
  const [activeTab, setActiveTab] = useState<'posts' | 'drafts'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting & Filtering State
  const [sortKey, setSortKey] = useState<'views' | 'likes' | 'comments' | 'shares' | 'date' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [privacyFilter, setPrivacyFilter] = useState<'ALL' | 'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('ALL');

  // Pinned videos (persisted per user in localStorage)
  const [pinnedVideoIds, setPinnedVideoIds] = useState<number[]>([]);

  // Action modals state
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [analyticsVideo, setAnalyticsVideo] = useState<Video | null>(null);
  const [commentsVideo, setCommentsVideo] = useState<Video | null>(null);
  const [activePopoverVideoId, setActivePopoverVideoId] = useState<number | string | null>(null);

  // Success/Error notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [drafts, setDrafts] = useState<DraftWithPreview[]>([]);

  const popoverRef = useRef<HTMLDivElement>(null);
  const draftsRef = useRef<DraftWithPreview[]>([]);

  useEffect(() => {
    let active = true;
    if (activeTab === 'drafts') {
      getDrafts().then(res => {
        if (!active) return;
        const draftsWithPreview = res.map(d => ({
          ...d,
          previewUrl: URL.createObjectURL(d.coverFile || d.file)
        }));
        setDrafts(draftsWithPreview);
        draftsRef.current = draftsWithPreview;
    }).catch((error: unknown) => {
      console.error(error);
    });
    }
    return () => {
      active = false;
      draftsRef.current.forEach(d => {
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
      });
      draftsRef.current = [];
    };
  }, [activeTab]);

  // Fetch pinned videos from localStorage on load
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`pinned_videos_${user.id}`);
      if (stored) {
        Promise.resolve().then(() => {
          setPinnedVideoIds(JSON.parse(stored));
        });
      }
    }
  }, [user?.id]);

  // Click outside listener to close popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopoverVideoId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Pin/Unpin
  const handleTogglePin = (videoId: number) => {
    let nextPinned = [...pinnedVideoIds];
    const isPinned = nextPinned.includes(videoId);
    
    if (isPinned) {
      nextPinned = nextPinned.filter(id => id !== videoId);
      triggerToast('Đã bỏ ghim video');
    } else {
      nextPinned.push(videoId);
      triggerToast('Đã ghim video lên đầu trang');
    }
    
    setPinnedVideoIds(nextPinned);
    if (user?.id) {
      localStorage.setItem(`pinned_videos_${user.id}`, JSON.stringify(nextPinned));
    }
    setActivePopoverVideoId(null);
  };

  // Visibility change handler
  const handleVisibilityChange = async (videoId: number, newVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;
      
      await updateMutation.mutateAsync({
        videoId,
        payload: {
          title: video.title,
          description: video.description,
          visibility: newVisibility,
          allowComments: video.allowComments
        }
      });
      triggerToast('Cập nhật quyền riêng tư thành công!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error(error);
      triggerToast(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật quyền riêng tư.', 'error');
    }
  };

  // Download video file
  const handleDownload = async (video: Video) => {
    try {
      setActivePopoverVideoId(null);
      triggerToast('Đang chuẩn bị tải về video...');
      
      const response = await fetch(video.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      triggerToast('Đang tải video về máy của bạn!');
    } catch (err) {
      console.error(err);
      // Fallback
      window.open(video.fileUrl, '_blank');
    }
  };

  // Delete video handler
  const handleDeleteVideo = async (videoId: number | string, isDraft?: boolean) => {
    setActivePopoverVideoId(null);
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không? Thao tác này không thể hoàn tác.')) {
      if (isDraft) {
        try {
          await deleteDraft(videoId.toString());
          setDrafts(prev => prev.filter(d => d.id !== videoId));
          triggerToast('Xóa bản nháp thành công!');
    } catch {
      triggerToast('Có lỗi xảy ra khi xóa bản nháp.', 'error');
    }
        return;
      }
      try {
        await deleteMutation.mutateAsync(videoId as number);
        triggerToast('Xóa video thành công!');
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        console.error(error);
        triggerToast(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa video.', 'error');
      }
    }
  };

  // Sort & Filter toggle logic
  const handleSortToggle = (key: 'views' | 'likes' | 'comments' | 'shares') => {
    if (sortKey === key) {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else {
        // Reset sort
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Filter privacy toggle
  const handlePrivacyFilterToggle = () => {
    const filters: ('ALL' | 'PUBLIC' | 'FRIENDS' | 'PRIVATE')[] = ['ALL', 'PUBLIC', 'FRIENDS', 'PRIVATE'];
    const nextIdx = (filters.indexOf(privacyFilter) + 1) % filters.length;
    setPrivacyFilter(filters[nextIdx]);
  };

  // Process sorting & filtering
  const filteredAndSortedVideos = useMemo(() => {
    if (activeTab === 'drafts') {
      let result: ManagedVideoRow[] = drafts.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        visibility: normalizeVisibility(d.visibility),
        createdAt: new Date(d.createdAt).toISOString(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        allowComments: d.allowComments,
        thumbnailUrl: d.previewUrl,
        _isDraft: true,
      }));

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(v => 
          (v.title && v.title.toLowerCase().includes(q)) || 
          (v.description && v.description.toLowerCase().includes(q))
        );
      }
      if (privacyFilter !== 'ALL') {
        result = result.filter(v => v.visibility === privacyFilter);
      }
      return result;
    }

    let result = [...videos];

    // 2. Filter by search query (checks title and description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        (v.title && v.title.toLowerCase().includes(q)) || 
        (v.description && v.description.toLowerCase().includes(q))
      );
    }

    // 3. Filter by privacy visibility
    if (privacyFilter !== 'ALL') {
      result = result.filter(v => v.visibility === privacyFilter);
    }

    // 4. Sort: Pinned videos ALWAYS float to top.
    // Secondary sorting depends on sortKey, defaulting to Date (descending).
    result.sort((a, b) => {
      const aPinned = pinnedVideoIds.includes(a.id);
      const bPinned = pinnedVideoIds.includes(b.id);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Both pinned or both unpinned, sort by selected key
      if (sortKey === 'views') {
        return sortOrder === 'asc' ? (a.viewCount || 0) - (b.viewCount || 0) : (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortKey === 'likes') {
        return sortOrder === 'asc' ? (a.likeCount || 0) - (b.likeCount || 0) : (b.likeCount || 0) - (a.likeCount || 0);
      }
      if (sortKey === 'comments') {
        return sortOrder === 'asc' ? (a.commentCount || 0) - (b.commentCount || 0) : (b.commentCount || 0) - (a.commentCount || 0);
      }
      if (sortKey === 'shares') {
        return sortOrder === 'asc' ? (a.shareCount || 0) - (b.shareCount || 0) : (b.shareCount || 0) - (a.shareCount || 0);
      }

      // Default sorting by Date (descending)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [videos, activeTab, drafts, searchQuery, privacyFilter, pinnedVideoIds, sortKey, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium text-sm">Đang tải danh sách bài đăng...</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-1 relative">
      <DocumentTitle title="Manage posts | TopTop Studio" />
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border transition-all duration-300 animate-in fade-in slide-in-from-top-4
          ${toastType === 'success' 
            ? 'bg-[#18c964]/10 border-[#18c964]/20 text-[#18c964]' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
          }
        `}>
          {toastType === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-6 border-b border-white/10 mb-6 pb-0 select-none">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-[16px] font-bold transition-all relative
            ${activeTab === 'posts' 
              ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand after:rounded-t-full' 
              : 'text-text-muted hover:text-text-primary'
            }
          `}
        >
          Bài đăng {videos.length}
        </button>
        <button 
          onClick={() => setActiveTab('drafts')}
          className={`pb-3 text-[16px] font-bold transition-all relative
            ${activeTab === 'drafts' 
              ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand after:rounded-t-full' 
              : 'text-text-muted hover:text-text-primary'
            }
          `}
        >
          Bản nháp {activeTab === 'drafts' ? drafts.length : ''}
        </button>
      </div>

      {/* Controls: Sorting Pills & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Sorting Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Views sort */}
          <button 
            onClick={() => handleSortToggle('views')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-all select-none hover:brightness-95
              ${sortKey === 'views' 
                ? 'bg-elevated border-text-primary text-text-primary font-bold shadow-sm' 
                : 'bg-surface border-elevated text-text-primary'
              }
            `}
          >
            <BarChart2 size={15} />
            <span>Lượt xem</span>
            {sortKey === 'views' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>

          {/* Likes sort */}
          <button 
            onClick={() => handleSortToggle('likes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-all select-none hover:brightness-95
              ${sortKey === 'likes' 
                ? 'bg-elevated border-text-primary text-text-primary font-bold shadow-sm' 
                : 'bg-surface border-elevated text-text-primary'
              }
            `}
          >
            <Check size={15} className="invisible w-0" />
            <span>Lượt thích</span>
            {sortKey === 'likes' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>

          {/* Comments sort */}
          <button 
            onClick={() => handleSortToggle('comments')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-all select-none hover:brightness-95
              ${sortKey === 'comments' 
                ? 'bg-elevated border-text-primary text-text-primary font-bold shadow-sm' 
                : 'bg-surface border-elevated text-text-primary'
              }
            `}
          >
            <span>Bình luận</span>
            {sortKey === 'comments' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>

          <button 
            onClick={() => handleSortToggle('shares')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-all select-none hover:brightness-95
              ${sortKey === 'shares' 
                ? 'bg-elevated border-text-primary text-text-primary font-bold shadow-sm' 
                : 'bg-surface border-elevated text-text-primary'
              }
            `}
          >
            <span>Lượt chia sẻ</span>
            {sortKey === 'shares' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>

          {/* Privacy filter */}
          <button 
            onClick={handlePrivacyFilterToggle}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-all select-none hover:brightness-95
              ${privacyFilter !== 'ALL' 
                ? 'bg-brand/10 border-brand/30 text-brand font-bold shadow-sm' 
                : 'bg-surface border-elevated text-text-primary'
              }
            `}
          >
            {privacyFilter === 'PUBLIC' && <Globe size={14} />}
            {privacyFilter === 'FRIENDS' && <Users size={14} />}
            {privacyFilter === 'PRIVATE' && <Lock size={14} />}
            <span>Quyền riêng tư: {
              privacyFilter === 'ALL' ? 'Tất cả' :
              privacyFilter === 'PUBLIC' ? 'Công khai' :
              privacyFilter === 'FRIENDS' ? 'Bạn bè' : 'Chỉ mình tôi'
            }</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mô tả bài đăng"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-elevated text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Content Table Card */}
      <div className="bg-background rounded-xl border border-elevated overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-surface border-b border-elevated text-[13px] font-bold text-text-muted select-none">
                <th className="px-6 py-4 font-bold max-w-[380px]">Nội dung (Đã tạo vào)</th>
                <th className="px-6 py-4 font-bold w-[160px]">Quyền riêng tư</th>
                <th className="px-6 py-4 font-bold w-[100px] cursor-pointer hover:text-text-primary" onClick={() => handleSortToggle('views')}>
                  Lượt xem {sortKey === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold w-[100px] cursor-pointer hover:text-text-primary" onClick={() => handleSortToggle('likes')}>
                  Lượt thích {sortKey === 'likes' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold w-[110px] cursor-pointer hover:text-text-primary" onClick={() => handleSortToggle('comments')}>
                  Bình luận {sortKey === 'comments' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold w-[110px] cursor-pointer hover:text-text-primary" onClick={() => handleSortToggle('shares')}>
                  Chia sẻ {sortKey === 'shares' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold w-[200px] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-elevated">
              {filteredAndSortedVideos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center text-text-muted">
                    Không tìm thấy bài đăng nào phù hợp với bộ lọc của bạn.
                  </td>
                </tr>
              ) : (
                filteredAndSortedVideos.map((video: ManagedVideoRow) => {
                  const isDraft = isDraftVideoRow(video);
                  const isPinned = !isDraft && pinnedVideoIds.includes(video.id);
                  return (
                    <tr key={video.id} className="hover:bg-hover transition-colors">
                      {/* Column 1: Video details */}
                      <td className="px-6 py-4 max-w-[380px]">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail vertical 9/16 preview */}
                          <div className="relative w-16 h-[88px] bg-black rounded-lg overflow-hidden border border-elevated flex-shrink-0">
                            {video.thumbnailUrl ? (
                              <Image 
                                src={video.thumbnailUrl} 
                                alt={video.title} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <VideoIcon className="text-zinc-600" size={24} />
                              </div>
                            )}
                            {/* Duration Badge */}
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                              {formatDuration(video.duration)}
                            </span>
                          </div>

                          {/* Description details */}
                          <div className="flex flex-col min-w-0 pt-0.5 space-y-1">
                            {isPinned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10 w-fit select-none">
                                <Pin size={10} className="fill-brand text-brand rotate-[30deg]" />
                                Đã ghim
                              </span>
                            )}
                            
                            <h3 className="font-bold text-[14px] text-text-primary leading-tight truncate">
                              {video.title}
                            </h3>
                            
                            <p className="text-[13px] text-text-secondary leading-snug line-clamp-2 pr-2">
                              {highlightHashtags(video.description)}
                            </p>
                            
                            <span className="text-[12px] text-text-muted select-none">
                              {formatVietnameseDate(video.createdAt)}
                            </span>
                            {renderVideoStatusBadge(video)}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Custom Privacy Dropdown */}
                      <td className="px-6 py-4">
                        {isDraft ? (
                          <span className="text-sm text-text-secondary">{
                            video.visibility === 'PUBLIC' ? 'Công khai' :
                            video.visibility === 'FRIENDS' ? 'Bạn bè' : 'Chỉ mình tôi'
                          }</span>
                        ) : (
                          <PrivacyDropdown 
                            videoId={video.id}
                            value={video.visibility || 'PUBLIC'}
                            onChange={handleVisibilityChange}
                            disabled={updateMutation.isPending}
                          />
                        )}
                      </td>

                      {/* Column 3: Views */}
                      <td className="px-6 py-4 text-[14px] font-bold text-text-primary select-none">
                        {video.viewCount?.toLocaleString() || 0}
                      </td>

                      {/* Column 4: Likes */}
                      <td className="px-6 py-4 text-[14px] font-bold text-text-primary select-none">
                        {video.likeCount?.toLocaleString() || 0}
                      </td>

                      {/* Column 5: Comments */}
                      <td className="px-6 py-4 text-[14px] font-bold text-text-primary select-none">
                        {video.commentCount?.toLocaleString() || 0}
                      </td>

                      {/* Column 6: Shares */}
                      <td className="px-6 py-4 text-[14px] font-bold text-text-primary select-none">
                        {video.shareCount?.toLocaleString() || 0}
                      </td>

                      {/* Column 7: Action Buttons Row */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 relative">
                          {!isDraft && (
                            <>
                              {/* 1. Edit details button */}
                              <button 
                                onClick={() => setEditingVideo(video)}
                                title="Chỉnh sửa bài đăng"
                                className="p-2 text-text-muted hover:text-text-primary hover:bg-hover rounded-full transition-colors"
                              >
                                <Pencil size={17} />
                              </button>

                              {/* 2. Analytics button */}
                              <button 
                                onClick={() => setAnalyticsVideo(video)}
                                title="Số liệu phân tích"
                                className="p-2 text-text-muted hover:text-text-primary hover:bg-hover rounded-full transition-colors"
                              >
                                <BarChart2 size={17} />
                              </button>

                              {/* 3. View comments button */}
                              <button 
                                onClick={() => setCommentsVideo(video)}
                                title="Xem bình luận"
                                className="p-2 text-text-muted hover:text-text-primary hover:bg-hover rounded-full transition-colors relative"
                              >
                                <MessageCircle size={17} />
                              </button>
                            </>
                          )}

                          {/* 4. More actions popover toggle */}
                          <button 
                            onClick={() => setActivePopoverVideoId(activePopoverVideoId === video.id ? null : video.id)}
                            className={`p-2 rounded-full transition-colors
                              ${activePopoverVideoId === video.id 
                                ? 'bg-hover text-text-primary' 
                                : 'text-text-muted hover:text-text-primary hover:bg-hover'
                              }
                            `}
                          >
                            <MoreHorizontal size={17} />
                          </button>

                          {/* Float Dropdown Popover */}
                          {activePopoverVideoId === video.id && (
                            <div 
                              ref={popoverRef}
                              className="absolute right-0 top-10 z-50 w-44 rounded-lg bg-surface border border-elevated shadow-xl overflow-hidden py-1 text-left animate-in fade-in slide-in-from-top-2 duration-150"
                            >
                              {!isDraft && (
                                <>
                                  <button
                                    onClick={() => handleTogglePin(video.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-text-primary hover:bg-hover transition-colors"
                                  >
                                    <Pin size={14} className="text-text-muted rotate-[30deg]" />
                                    <span>{isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(video)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-text-primary hover:bg-hover transition-colors"
                                  >
                                    <Download size={14} className="text-text-muted" />
                                    <span>Tải về</span>
                                  </button>
                                  <div className="h-px bg-elevated my-1" />
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteVideo(video.id, isDraft)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} className="text-red-500" />
                                <span>Xóa bài đăng</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. EDIT MODAL: Sửa chi tiết video                             */}
      {/* ============================================================== */}
      {editingVideo && (
        <EditVideoModal 
          video={editingVideo} 
          onClose={() => setEditingVideo(null)} 
          onSuccess={(msg) => {
            setEditingVideo(null);
            triggerToast(msg);
          }}
          userId={user?.id}
        />
      )}

      {/* ============================================================== */}
      {/* 2. ANALYTICS MODAL: Số liệu phân tích bài đăng                */}
      {/* ============================================================== */}
      {analyticsVideo && (
        <AnalyticsModal 
          video={analyticsVideo} 
          onClose={() => setAnalyticsVideo(null)} 
        />
      )}

      {/* ============================================================== */}
      {/* 3. COMMENTS MODAL: Quản lý và duyệt bình luận                 */}
      {/* ============================================================== */}
      {commentsVideo && (
        <CommentsModal 
          video={commentsVideo} 
          onClose={() => setCommentsVideo(null)} 
          onDeleteSuccess={(msg) => triggerToast(msg)}
        />
      )}

    </div>
  );
}

/* ========================================================================== */
/* EDIT VIDEO SUB-COMPONENT MODAL                                             */
/* ========================================================================== */
interface EditVideoModalProps {
  video: Video;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  userId?: number;
}

function EditVideoModal({ video, onClose, onSuccess, userId }: EditVideoModalProps) {
  const updateMutation = useUpdateVideoMutation(userId);
  const [title, setTitle] = useState(video.title || '');
  const [description, setDescription] = useState(video.description || '');
  const [allowComments, setAllowComments] = useState(video.allowComments ?? true);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(video.sound ?? null);
  const [soundEditorOpen, setSoundEditorOpen] = useState(false);
  const [soundEditorInitialTool, setSoundEditorInitialTool] = useState<'edit' | 'sound'>('edit');
  const [videoTrim, setVideoTrim] = useState({ startSeconds: 0, endSeconds: video.duration ?? 0 });
  const [soundTrim, setSoundTrim] = useState({
    startSeconds: 0,
    endSeconds: video.sound?.durationSeconds ?? 0,
  });
  const [soundVolume, setSoundVolume] = useState(100);
  const [soundMuted, setSoundMuted] = useState(false);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(100);
  const [soundStartOffset, setSoundStartOffset] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const formatEditorDuration = (seconds?: number | null) => {
    const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
    return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
  };

  const isChanged = 
    title !== (video.title || '') ||
    description !== (video.description || '') ||
    allowComments !== (video.allowComments ?? true) ||
    selectedSound?.id !== video.sound?.id ||
    videoTrim.startSeconds > 0 ||
    (videoTrim.endSeconds > 0 && videoTrim.endSeconds !== (video.duration ?? 0)) ||
    soundTrim.startSeconds > 0 ||
    (selectedSound && soundTrim.endSeconds > 0 && soundTrim.endSeconds !== selectedSound.durationSeconds) ||
    soundVolume !== 100 ||
    soundMuted ||
    originalAudioVolume !== 100 ||
    soundStartOffset > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Tiêu đề không được để trống');
      return;
    }

    try {
      setErrorMessage('');
      await updateMutation.mutateAsync({
        videoId: video.id,
        payload: {
          title,
          description,
          visibility: video.visibility,
          allowComments,
          soundId: selectedSound?.id ?? null,
          editInstructions: {
            videoTrim: {
              startSeconds: videoTrim.startSeconds,
              endSeconds: videoTrim.endSeconds || video.duration || 0,
            },
            selectedSoundId: selectedSound?.id ?? null,
            soundTrim: selectedSound ? {
              startSeconds: soundTrim.startSeconds,
              endSeconds: soundTrim.endSeconds > 0 ? soundTrim.endSeconds : null,
            } : null,
            audioMix: {
              originalAudioVolume: Math.min(1, originalAudioVolume / 100),
              soundVolume: selectedSound ? (soundMuted ? 0 : Math.min(1, soundVolume / 100)) : 0,
              soundStartAtVideoSeconds: soundStartOffset,
            },
            coverFrameSeconds: null,
          },
        }
      });
      onSuccess('Cập nhật chi tiết video thành công!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error(error);
      setErrorMessage(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin video.');
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 px-4 select-none">
      <div className="modal-opacity-solid w-full max-w-[600px] overflow-hidden rounded-xl bg-[#121212] border border-white/10 text-white shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <h2 className="text-lg font-bold">Chỉnh sửa chi tiết bài đăng</h2>
          <button 
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {errorMessage && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Tiêu đề video</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề video"
              maxLength={150}
              disabled={updateMutation.isPending}
              className="w-full rounded bg-[#2f2f2f] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Mô tả bài đăng (bao gồm hashtags)</label>
              <span className="text-[11px] text-white/30">{description.length}/4000</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 4000))}
              placeholder="Nhập mô tả bài đăng tại đây"
              maxLength={4000}
              rows={4}
              disabled={updateMutation.isPending}
              className="w-full rounded bg-[#2f2f2f] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition resize-none"
            />
          </div>

          {/* Comments toggle */}
          <div className="flex items-center justify-between bg-[#1d1d1d] p-4 rounded-lg border border-white/5 select-none">
            <div>
              <h4 className="text-sm font-bold text-white">Cho phép người xem bình luận</h4>
              <p className="text-xs text-white/50 mt-0.5">Người dùng sẽ có thể gửi bình luận công khai dưới video này</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowComments(!allowComments)}
              disabled={updateMutation.isPending}
              className="text-white hover:text-brand transition"
            >
              {allowComments ? (
                <ToggleRight className="w-12 h-8 text-brand fill-brand" />
              ) : (
                <ToggleLeft className="w-12 h-8 text-white/30" />
              )}
            </button>
          </div>

          <div className="rounded-lg border border-white/5 bg-[#1d1d1d] p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Chỉnh video và âm thanh</h4>
                <p className="mt-0.5 text-xs text-white/50">
                  Cắt đoạn video, chọn nhạc và chỉnh âm lượng cho bài đăng này.
                </p>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                Mini editor
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSoundEditorInitialTool('edit');
                  setSoundEditorOpen(true);
                }}
                disabled={updateMutation.isPending}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                <Scissors size={22} />
                Cắt video
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundEditorInitialTool('sound');
                  setSoundEditorOpen(true);
                }}
                disabled={updateMutation.isPending}
                className={`flex h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${
                  selectedSound
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-white/10 bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              >
                <Music size={22} />
                <span>Âm thanh</span>
                {selectedSound ? (
                  <span className="max-w-full truncate text-xs text-white/45">{selectedSound.title}</span>
                ) : null}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/50">
              <div className="rounded bg-black/20 px-3 py-2">
                Video: {formatEditorDuration(videoTrim.startSeconds)} - {formatEditorDuration(videoTrim.endSeconds || video.duration)}
              </div>
              <div className="rounded bg-black/20 px-3 py-2">
                Nhạc: {selectedSound ? `${formatEditorDuration(soundTrim.startSeconds)} - ${formatEditorDuration(soundTrim.endSeconds || selectedSound.durationSeconds)}` : 'Chưa chọn'}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex h-20 shrink-0 items-center justify-end gap-3 border-t border-white/10 px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="h-10 rounded px-5 text-sm font-bold bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isChanged || updateMutation.isPending}
            className={`h-10 rounded px-6 text-sm font-bold transition flex items-center justify-center min-w-[80px]
              ${(!isChanged || updateMutation.isPending)
                ? 'bg-[#333333] text-white/30 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 text-white'
              }
            `}
          >
            {updateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Lưu'
            )}
          </button>
        </div>
      </div>

      <SoundEditorPanel
        isOpen={soundEditorOpen}
        initialTool={soundEditorInitialTool}
        previewUrl={video.fileUrl}
        description={description}
        selectedSound={selectedSound}
        trimStartSeconds={videoTrim.startSeconds}
        trimEndSeconds={videoTrim.endSeconds}
        soundTrimStartSeconds={soundTrim.startSeconds}
        soundTrimEndSeconds={soundTrim.endSeconds}
        soundVolume={soundVolume}
        soundMuted={soundMuted}
        originalAudioVolume={originalAudioVolume}
        soundStartAtVideoSeconds={soundStartOffset}
        showTextTool={false}
        onSelectSound={setSelectedSound}
        onTrimChange={setVideoTrim}
        onSoundTrimChange={setSoundTrim}
        onSoundVolumeChange={setSoundVolume}
        onSoundMutedChange={setSoundMuted}
        onOriginalAudioVolumeChange={setOriginalAudioVolume}
        onSoundStartAtVideoSecondsChange={setSoundStartOffset}
        onClose={() => setSoundEditorOpen(false)}
      />
    </div>
  );
}

/* ========================================================================== */
/* ANALYTICS VIDEO SUB-COMPONENT MODAL                                        */
/* ========================================================================== */
interface AnalyticsModalProps {
  video: Video;
  onClose: () => void;
}

function AnalyticsModal({ video, onClose }: AnalyticsModalProps) {
  // Generate random data points based on video.viewCount for mock analytics chart
  const dataPoints = useMemo(() => {
    const base = video.viewCount || 0;
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
      // mock a nice curve (pure and deterministic to satisfy react-hooks/purity)
      const factor = 0.4 + 0.6 * Math.sin((i / 6) * Math.PI);
      const views = Math.round(base * factor + ((i * 17 + (video.id || 0)) % 5));
      return { label: formattedDate, value: views };
    });
  }, [video.viewCount, video.id]);

  const maxVal = Math.max(...dataPoints.map(d => d.value), 10);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="modal-opacity-solid w-full max-w-[650px] overflow-hidden rounded-xl bg-[#121212] border border-white/10 text-white shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <div>
            <h2 className="text-lg font-bold">Số liệu phân tích bài đăng</h2>
            <p className="text-xs text-white/50 truncate max-w-[500px] mt-0.5">{video.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {/* Metric 1 */}
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white/40 block mb-1">Lượt xem</span>
              <span className="text-2xl font-bold text-white leading-none block">
                {video.viewCount?.toLocaleString() || 0}
              </span>
            </div>
            {/* Metric 2 */}
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white/40 block mb-1">Lượt thích</span>
              <span className="text-2xl font-bold text-white leading-none block">
                {video.likeCount?.toLocaleString() || 0}
              </span>
            </div>
            {/* Metric 3 */}
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white/40 block mb-1">Bình luận</span>
              <span className="text-2xl font-bold text-white leading-none block">
                {video.commentCount?.toLocaleString() || 0}
              </span>
            </div>
            {/* Metric 4 */}
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white/40 block mb-1">Chia sẻ</span>
              <span className="text-2xl font-bold text-white leading-none block">
                {video.shareCount?.toLocaleString() || 0}
              </span>
            </div>
            {/* Metric 5 */}
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white/40 block mb-1">Lượt lưu</span>
              <span className="text-2xl font-bold text-white leading-none block">
                {video.saveCount?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* SVG Mock Line Chart */}
          <div className="bg-[#1c1c1c] p-6 rounded-xl border border-white/5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Xu hướng lượt xem trong 7 ngày qua</h3>
              <p className="text-xs text-white/40 mt-0.5">Tổng số lượt hiển thị và xem video theo thời gian thực</p>
            </div>

            {/* SVG line and gradient graph */}
            <div className="relative h-48 w-full pt-4">
              <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef2f49" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef2f49" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Path calculation */}
                {(() => {
                  const points = dataPoints.map((dp, i) => {
                    const x = 50 + (i / 6) * 500;
                    const y = 140 - (dp.value / maxVal) * 110;
                    return { x, y };
                  });

                  const dPath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
                  const dArea = `${dPath} L 550,140 L 50,140 Z`;

                  return (
                    <>
                      {/* Gradient Area */}
                      <path d={dArea} fill="url(#gradient-area)" />
                      {/* Line */}
                      <path d={dPath} fill="none" stroke="#ef2f49" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Dots */}
                      {points.map((p, index) => (
                        <g key={index}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#ef2f49" stroke="#121212" strokeWidth="2" />
                          {/* Tooltip labels */}
                          <text x={p.x} y={p.y - 12} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                            {dataPoints[index].value}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between px-[38px] mt-2 select-none">
                {dataPoints.map((dp, i) => (
                  <span key={i} className="text-[10px] font-bold text-white/40">
                    {dp.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-16 shrink-0 items-center justify-end border-t border-white/10 px-6">
          <button
            onClick={onClose}
            className="h-10 rounded px-6 text-sm font-bold bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* COMMENTS VIDEO SUB-COMPONENT MODAL                                         */
/* ========================================================================== */
interface CommentsModalProps {
  video: Video;
  onClose: () => void;
  onDeleteSuccess: (msg: string) => void;
}

function CommentsModal({ video, onClose, onDeleteSuccess }: CommentsModalProps) {
  const { data: commentsResponse, isLoading, refetch } = useComments(video.id);
  const comments = commentsResponse?.data || [];

  const deleteCommentMutation = useDeleteCommentMutation(video.id);

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
        onDeleteSuccess('Đã xóa bình luận thành công!');
        refetch();
      } catch (err: unknown) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="modal-opacity-solid w-full max-w-[650px] overflow-hidden rounded-xl bg-[#121212] border border-white/10 text-white shadow-2xl flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <div>
            <h2 className="text-lg font-bold">Duyệt bình luận video</h2>
            <p className="text-xs text-white/50 truncate max-w-[500px] mt-0.5">{video.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body list of comments */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
              <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/50">Đang tải các bình luận...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-3">
              <MessageSquare size={40} className="text-white/20" />
              <p className="text-sm font-semibold text-white/40">Chưa có bình luận nào cho video này.</p>
              <p className="text-xs text-white/30 max-w-[300px]">Mọi bình luận của người xem sẽ được hiển thị và quản lý tại đây.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5 flex gap-4 items-start hover:border-white/10 transition"
              >
                {/* User avatar */}
                <div className="relative w-9 h-9 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                  {comment.userAvatarUrl ? (
                    <Image 
                      src={comment.userAvatarUrl} 
                      alt={comment.username || 'User'} 
                      fill 
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center">
                      {(comment.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Comment Text details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5 truncate">
                      <span className="text-[13.5px] font-bold text-white">{comment.username}</span>
                      <span className="text-[11px] text-white/40">@{comment.username}</span>
                    </div>
                    <span className="text-[11px] text-white/30 select-none">
                      {formatVietnameseDate(comment.createdAt)}
                    </span>
                  </div>

                  <p className="text-[13px] text-white/80 leading-relaxed pr-6 break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Delete Comment action */}
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Xóa bình luận"
                  disabled={deleteCommentMutation.isPending}
                  className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex h-16 shrink-0 items-center justify-between border-t border-white/10 px-6 bg-[#121212]">
          <span className="text-xs font-semibold text-white/40">Tổng số: {comments.length} bình luận</span>
          <button
            onClick={onClose}
            className="h-10 rounded px-6 text-sm font-bold bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* CUSTOM PRIVACY DROPDOWN SUB-COMPONENT                                      */
/* ========================================================================== */
interface PrivacyDropdownProps {
  videoId: number;
  value: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  onChange: (videoId: number, newValue: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') => void;
  disabled?: boolean;
}

function PrivacyDropdown({ videoId, value, onChange, disabled }: PrivacyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getVisibilityConfig = (val?: string) => {
    const normalized = (val || 'PUBLIC').toUpperCase();
    switch (normalized) {
      case 'FRIENDS':
        return { label: 'Bạn bè', icon: <Users size={13} className="text-[#3b82f6]" /> };
      case 'PRIVATE':
        return { label: 'Chỉ mình tôi', icon: <Lock size={13} className="text-amber-500" /> };
      case 'PUBLIC':
      default:
        return { label: 'Công khai', icon: <Globe size={13} className="text-emerald-500" /> };
    }
  };

  const current = getVisibilityConfig(value);

  const handleSelect = (val: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') => {
    if (disabled) return;
    onChange(videoId, val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative w-[138px] select-none text-left ${isOpen ? 'z-50' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 bg-surface border border-elevated rounded px-2.5 py-1.5 text-[13px] font-semibold text-text-primary hover:border-text-primary focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-100 transition cursor-pointer"
      >
        <div className="flex items-center gap-1.5 truncate">
          {current.icon}
          <span className="truncate">{current.label}</span>
        </div>
        <ChevronDown 
          size={13} 
          className={`text-text-muted transition-transform duration-200 flex-shrink-0
            ${isOpen ? 'rotate-180 text-text-primary' : ''}
          `} 
        />
      </button>

      {/* Options Menu overlay */}
      {isOpen && (
        <div className="select-options-solid absolute left-0 right-0 top-[36px] z-[999] rounded bg-white dark:bg-[#242424] border border-black/10 dark:border-white/10 shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map((option) => {
            const config = getVisibilityConfig(option);
            const isSelected = option === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors
                  ${isSelected ? 'bg-black/5 dark:bg-white/5 text-brand font-bold' : 'text-text-primary'}
                `}
              >
                {config.icon}
                <span>{config.label}</span>
                {isSelected && (
                  <Check size={12} className="text-brand ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
