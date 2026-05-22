'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { BarChart3, Eye, Heart, MessageSquare, Share2, Bookmark, Video as VideoIcon } from 'lucide-react';
import { RootState } from '@/store/store';
import { useStudioDailyViews, useUserVideos } from '@/hooks/video-hooks';
import { DocumentTitle } from '@/components/shared/DocumentTitle';

type MetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'saves' | 'videos';

const metricMeta: Record<MetricKey, { label: string; icon: ReactNode; color: string }> = {
  views: { label: 'Lượt xem', icon: <Eye size={18} />, color: '#3b82f6' },
  likes: { label: 'Lượt thích', icon: <Heart size={18} />, color: '#ef4444' },
  comments: { label: 'Bình luận', icon: <MessageSquare size={18} />, color: '#10b981' },
  shares: { label: 'Chia sẻ', icon: <Share2 size={18} />, color: '#f59e0b' },
  saves: { label: 'Lượt lưu', icon: <Bookmark size={18} />, color: '#8b5cf6' },
  videos: { label: 'Video', icon: <VideoIcon size={18} />, color: '#06b6d4' },
};

export default function StudioAnalyticsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [days, setDays] = useState<7 | 28 | 60>(7);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('views');
  const { data: videosResponse, isLoading } = useUserVideos(user?.id);
  const { data: dailyViewsResponse } = useStudioDailyViews(days, Boolean(user));
  const videos = useMemo(() => videosResponse?.data ?? [], [videosResponse?.data]);

  const totals = useMemo(() => ({
    views: videos.reduce((sum, video) => sum + (video.viewCount ?? 0), 0),
    likes: videos.reduce((sum, video) => sum + (video.likeCount ?? 0), 0),
    comments: videos.reduce((sum, video) => sum + (video.commentCount ?? 0), 0),
    shares: videos.reduce((sum, video) => sum + (video.shareCount ?? 0), 0),
    saves: videos.reduce((sum, video) => sum + (video.saveCount ?? 0), 0),
    videos: videos.length,
  }), [videos]);

  const chartLabels = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-');
      return {
        key,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime(),
      };
    });
  }, [days]);

  const chartValues = useMemo(() => {
    if (activeMetric === 'views') {
      const viewsByDate = new Map((dailyViewsResponse?.data ?? []).map((item) => [item.date, item.views ?? 0]));
      return chartLabels.map((item) => viewsByDate.get(item.key) ?? 0);
    }

    return chartLabels.map((item) =>
      videos.reduce((sum, video) => {
        const createdAt = new Date(video.createdAt).getTime();
        if (createdAt < item.start || createdAt >= item.end) return sum;
        if (activeMetric === 'videos') return sum + 1;
        if (activeMetric === 'likes') return sum + (video.likeCount ?? 0);
        if (activeMetric === 'comments') return sum + (video.commentCount ?? 0);
        if (activeMetric === 'shares') return sum + (video.shareCount ?? 0);
        return sum + (video.saveCount ?? 0);
      }, 0),
    );
  }, [activeMetric, chartLabels, dailyViewsResponse?.data, videos]);

  const topVideos = useMemo(
    () => [...videos].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 6),
    [videos],
  );

  const maxValue = Math.max(...chartValues, 1);
  const points = chartValues.map((value, index) => {
    const x = 32 + (index / Math.max(chartValues.length - 1, 1)) * 736;
    const y = 176 - (value / maxValue) * 132;
    return { x, y, value };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} 176 L ${points[0].x} 176 Z` : '';
  const activeColor = metricMeta[activeMetric].color;

  return (
    <>
      <DocumentTitle title="Analytics | TopTop Studio" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">TopTop Studio</p>
            <h1 className="mt-1 text-3xl font-black text-text-primary">Phân tích</h1>
            <p className="mt-2 text-sm text-text-secondary">Theo dõi hiệu suất video, tương tác và xu hướng tăng trưởng của kênh.</p>
          </div>
          <div className="flex rounded-lg border border-elevated bg-background p-1">
            {([7, 28, 60] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                  days === value ? 'bg-brand text-white' : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
              >
                {value} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {(Object.keys(metricMeta) as MetricKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMetric(key)}
              className={`rounded-lg border bg-background p-4 text-left transition-colors ${
                activeMetric === key ? 'border-brand shadow-sm' : 'border-elevated hover:bg-hover'
              }`}
            >
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-bold uppercase">{metricMeta[key].label}</span>
                <span style={{ color: metricMeta[key].color }}>{metricMeta[key].icon}</span>
              </div>
              <p className="mt-3 text-2xl font-black text-text-primary">{totals[key].toLocaleString()}</p>
            </button>
          ))}
        </div>

        <section className="rounded-lg border border-elevated bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-text-primary">{metricMeta[activeMetric].label}</h2>
              <p className="text-sm text-text-secondary">Biểu đồ theo khoảng thời gian đã chọn</p>
            </div>
            <BarChart3 className="text-text-muted" size={22} />
          </div>
          <div className="h-[260px]">
            {isLoading ? (
              <div className="grid h-full place-items-center text-sm font-semibold text-text-muted">Đang tải dữ liệu...</div>
            ) : (
              <svg viewBox="0 0 800 220" className="h-full w-full">
                <defs>
                  <linearGradient id="studio-analytics-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[44, 88, 132, 176].map((y) => (
                  <line key={y} x1="24" x2="776" y1={y} y2={y} stroke="currentColor" className="text-elevated" />
                ))}
                <path d={areaPath} fill="url(#studio-analytics-fill)" />
                <path d={linePath} fill="none" stroke={activeColor} strokeWidth="3" strokeLinecap="round" />
                {points.map((point, index) => (
                  <g key={index}>
                    <circle cx={point.x} cy={point.y} r="4.5" fill={activeColor} stroke="var(--background)" strokeWidth="2" />
                    {days === 7 ? (
                      <text x={point.x} y="208" textAnchor="middle" fill="currentColor" className="text-[11px] font-bold text-text-muted">
                        {chartLabels[index].label}
                      </text>
                    ) : null}
                  </g>
                ))}
              </svg>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-elevated bg-background">
          <div className="border-b border-elevated p-5">
            <h2 className="text-lg font-black text-text-primary">Video nổi bật</h2>
            <p className="text-sm text-text-secondary">Sắp xếp theo lượt xem cao nhất</p>
          </div>
          <div className="divide-y divide-elevated">
            {topVideos.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-text-muted">Chưa có video để phân tích.</div>
            ) : topVideos.map((video) => (
              <div key={video.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{video.title || video.description || 'Không có tiêu đề'}</p>
                  <p className="mt-1 text-xs text-text-muted">@{video.username}</p>
                </div>
                <div className="grid grid-cols-4 gap-4 text-right text-sm">
                  <span>{(video.viewCount ?? 0).toLocaleString()} xem</span>
                  <span>{(video.likeCount ?? 0).toLocaleString()} thích</span>
                  <span>{(video.commentCount ?? 0).toLocaleString()} BL</span>
                  <span>{(video.shareCount ?? 0).toLocaleString()} share</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
