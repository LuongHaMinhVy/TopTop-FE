'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { 
  Heart, 
  MessageSquare, 
  ChevronDown, 
  Check, 
  Play, 
  Video, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useUserVideos } from '@/hooks/video-hooks';
import Image from 'next/image';

export default function StudioDashboard() {
  const t = useTranslations('Studio');
  const locale = useLocale();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Fetch real user videos
  const { data: videosResponse, isLoading } = useUserVideos(user?.id);
  const videos = useMemo(() => videosResponse?.data || [], [videosResponse]);

  // State for active metric tab
  const [activeMetric, setActiveMetric] = useState<'views' | 'profile_views' | 'likes' | 'comments' | 'shares' | 'earnings'>('views');
  
  // State for date range selector
  const [dateRange, setDateRange] = useState<'7' | '28' | '60'>('7');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Calculate real channel statistics
  const totalViews = useMemo(() => videos.reduce((sum, v) => sum + (v.viewCount || 0), 0), [videos]);
  const totalLikes = useMemo(() => videos.reduce((sum, v) => sum + (v.likeCount || 0), 0), [videos]);
  const totalComments = useMemo(() => videos.reduce((sum, v) => sum + (v.commentCount || 0), 0), [videos]);

  // Mock trend data configurations for the last 7 days (localized)
  const chartData = useMemo(() => {
    // Spreads views across 7 days
    const viewsBase = [12, 45, 23, 67, 34, 89, 56];
    const viewsSum = viewsBase.reduce((a, b) => a + b, 0);
    const viewsPoints = totalViews > 0 
      ? viewsBase.map(v => Math.round((v / viewsSum) * totalViews))
      : [0, 0, 0, 0, 0, 0, 0];

    // Spreads likes across 7 days
    const likesBase = [2, 5, 3, 8, 4, 12, 7];
    const likesSum = likesBase.reduce((a, b) => a + b, 0);
    const likesPoints = totalLikes > 0
      ? likesBase.map(l => Math.round((l / likesSum) * totalLikes))
      : [0, 0, 0, 0, 0, 0, 0];

    // Spreads comments across 7 days
    const commentsBase = [0, 2, 1, 3, 1, 4, 2];
    const commentsSum = commentsBase.reduce((a, b) => a + b, 0);
    const commentsPoints = totalComments > 0
      ? commentsBase.map(c => Math.round((c / commentsSum) * totalComments))
      : [0, 0, 0, 0, 0, 0, 0];

    const localizedDates = locale === 'vi'
      ? ['10 tháng 5', '11 tháng 5', '12 tháng 5', '13 tháng 5', '14 tháng 5', '15 tháng 5', '16 tháng 5']
      : ['May 10', 'May 11', 'May 12', 'May 13', 'May 14', 'May 15', 'May 16'];

    return {
      views: {
        title: t('home.videoViewsTab'),
        value: totalViews.toLocaleString(),
        trend: '0 (-)',
        points: viewsPoints,
        dates: localizedDates,
        color: '#3b82f6'
      },
      profile_views: {
        title: t('home.profileViewsTab'),
        value: '5',
        trend: '+4 (400.0%)',
        points: [0, 1, 0, 2, 1, 0, 1],
        dates: localizedDates,
        color: '#8b5cf6'
      },
      likes: {
        title: t('home.likesTab'),
        value: totalLikes.toLocaleString(),
        trend: '0 (-)',
        points: likesPoints,
        dates: localizedDates,
        color: '#ef4444'
      },
      comments: {
        title: t('home.commentsTab'),
        value: totalComments.toLocaleString(),
        trend: '0 (-)',
        points: commentsPoints,
        dates: localizedDates,
        color: '#10b981'
      },
      shares: {
        title: t('home.sharesTab'),
        value: '0',
        trend: '0 (-)',
        points: [0, 0, 0, 0, 0, 0, 0],
        dates: localizedDates,
        color: '#f59e0b'
      },
      earnings: {
        title: t('home.earningsTab'),
        value: '$0,00',
        trend: '0,00 (0.0%)',
        points: [0, 0, 0, 0, 0, 0, 0],
        dates: localizedDates,
        color: '#06b6d4'
      }
    };
  }, [totalViews, totalLikes, totalComments, locale, t]);

  const activeData = chartData[activeMetric];

  // SVG Chart path calculators
  const svgWidth = 800;
  const svgHeight = 160;
  const paddingX = 50;
  const paddingY = 20;

  const points = activeData.points;
  const maxVal = Math.max(...points, 5); // default height baseline

  const coordinates = useMemo(() => {
    const totalPoints = points.length;
    const stepX = (svgWidth - paddingX * 2) / (totalPoints - 1);
    
    return points.map((val, idx) => {
      const x = paddingX + idx * stepX;
      // Map y between paddingY and svgHeight - paddingY
      const y = svgHeight - paddingY - ((val / maxVal) * (svgHeight - paddingY * 2));
      return { x, y, value: val };
    });
  }, [points, maxVal]);

  const pathD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return coordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  }, [coordinates]);

  const areaD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return `${pathD} L ${coordinates[coordinates.length - 1].x} ${svgHeight - paddingY} L ${coordinates[0].x} ${svgHeight - paddingY} Z`;
  }, [coordinates, pathD]);

  // Generate dynamic sample comments tied to real user videos (localized)
  const mockComments = useMemo(() => {
    const sampleTexts = locale === 'vi' ? [
      'Video đỉnh quá bạn ơi, hóng phần tiếp theo! 🔥',
      'Nhạc cuốn dã man, xin tên bài hát với ạ 🎵',
      'Edit mượt quá, xin tip hướng dẫn đi ạ! 🎬',
      'Tập này bánh cuốn thực sự, xem đi xem lại không chán 💯',
      'Quá tuyệt vời! Chúc kênh ngày càng phát triển nhé 🚀'
    ] : [
      'Amazing video! Looking forward to the next part! 🔥',
      'This song is so catchy, what is the name? 🎵',
      'So smooth, please share an editing tutorial! 🎬',
      'This episode is so good, watched it on repeat 💯',
      'Incredible! Wishing your channel great success 🚀'
    ];
    const authors = ['nguyen_thi_ha', 'quan_kun99', 'toptop_fan', 'linh_chi_95', 'hoang_duong_media'];

    if (videos.length === 0) {
      return [
        { id: 1, author: 'nguyen_thi_ha', text: t('home.noComments'), time: locale === 'vi' ? '3 giờ trước' : '3 hours ago', videoTitle: t('title') },
        { id: 2, author: 'quan_kun99', text: t('home.noCommentsDesc'), time: locale === 'vi' ? '1 ngày trước' : '1 day ago', videoTitle: t('title') }
      ];
    }

    return Array.from({ length: Math.min(3, videos.length) }).map((_, idx) => {
      const video = videos[idx];
      return {
        id: idx + 1,
        author: authors[idx % authors.length],
        text: sampleTexts[idx % sampleTexts.length],
        time: idx === 0 
          ? (locale === 'vi' ? '3 giờ trước' : '3 hours ago') 
          : (locale === 'vi' ? `${idx} ngày trước` : `${idx} day${idx > 1 ? 's' : ''} ago`),
        videoTitle: video?.description || video?.title || t('home.recentPosts')
      };
    });
  }, [videos, locale, t]);

  // Parse description text to color hashtags blue
  const renderDescription = (desc?: string) => {
    if (!desc) return t('home.emptyTitle');
    const parts = desc.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return <span key={index} className="text-brand font-semibold hover:underline cursor-pointer">{part}</span>;
      }
      return part;
    });
  };

  // Helper to format localized timestamp
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + `, ${date.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
    } catch {
      return dateString;
    }
  };

  // Date range labels (localized)
  const dateRangeLabels = {
    '7': t('home.days7'),
    '28': t('home.days28'),
    '60': t('home.days60')
  };

  return (
    <div className="py-2 text-text-primary">
      {/* 1. TOP PROFILE BANNER */}
      <div className="bg-background border border-elevated rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition duration-200">
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-elevated shrink-0 bg-surface flex items-center justify-center font-bold text-xl text-white/80">
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.nickname || ''} fill sizes="64px" className="object-cover" unoptimized />
            ) : (
              user?.username?.[0].toUpperCase()
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{user?.nickname || user?.username}</h2>
              <span className="text-xs text-text-muted">@{user?.username}</span>
            </div>
            <p className="text-xs text-text-secondary italic">
              {user?.bio || 'Anime iz mah life'}
            </p>
            {/* Live Counts bar */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
              <span>{t('home.likesCount')} <strong className="text-text-primary font-bold">{totalLikes}</strong></span>
              <span className="text-white/10">•</span>
              <span>{t('home.followersCount')} <strong className="text-text-primary font-bold">746</strong></span>
              <span className="text-white/10">•</span>
              <span>{t('home.followingCount')} <strong className="text-text-primary font-bold">929</strong></span>
            </div>
          </div>
        </div>

        {/* View Profile shortcut button */}
        <Link 
          href={`/@${user?.username}`} 
          className="self-start md:self-center bg-[#2f2f2f] hover:bg-[#3f3f3f] px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-sm shrink-0 flex items-center gap-1.5"
        >
          {t('home.viewProfile')}
        </Link>
      </div>

      {/* 2. KEY METRICS CONTAINER ("Số liệu chính") */}
      <div className="bg-background border border-elevated rounded-xl shadow-sm mb-8 overflow-hidden transition duration-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-elevated">
          <div className="flex items-center gap-1 cursor-pointer group">
            <h3 className="font-bold text-[15px]">{t('home.keyMetrics')}</h3>
            <ArrowRight size={14} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Custom Dropdown Date Range Pill */}
          <div ref={dateDropdownRef} className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-full px-4 py-2 text-[13px] font-semibold text-text-primary transition cursor-pointer select-none"
            >
              <span>{dateRangeLabels[dateRange]}</span>
              <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180 text-text-primary' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-[160px] z-[999] rounded bg-[#242424] border border-white/10 shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {(['7', '28', '60'] as const).map((range) => {
                  const isSelected = dateRange === range;
                  return (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[13px] font-medium text-left hover:bg-white/10 transition-colors
                        ${isSelected ? 'bg-white/5 text-brand font-bold' : 'text-white/80'}
                      `}
                    >
                      <span>{dateRangeLabels[range]}</span>
                      {isSelected && <Check size={12} className="text-brand" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Metric Tabs bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-elevated">
          {(['views', 'profile_views', 'likes', 'comments', 'shares', 'earnings'] as const).map((metric) => {
            const data = chartData[metric];
            const isSelected = activeMetric === metric;
            const isTrendUp = data.trend.startsWith('+');
            const isTrendFlat = data.trend.includes('0 (-)') || data.trend.startsWith('0,00') || data.trend.startsWith('0.00');

            return (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-5 py-5 text-center flex flex-col items-center justify-center gap-1.5 transition-all outline-none border-b-2
                  ${isSelected 
                    ? 'border-brand bg-[#2f2f2f]/10' 
                    : 'border-transparent hover:bg-hover'
                  }
                `}
              >
                <span className="text-[12px] font-semibold text-text-secondary truncate w-full">
                  {data.title}
                </span>
                
                <span className="text-[20px] font-bold text-text-primary tracking-tight">
                  {data.value}
                </span>

                <span className={`text-[10px] font-bold flex items-center gap-0.5
                  ${isTrendFlat 
                    ? 'text-text-muted' 
                    : isTrendUp 
                      ? 'text-emerald-500' 
                      : 'text-rose-500'
                  }
                `}>
                  {isTrendUp && '↑ '}
                  {data.trend}
                </span>
              </button>
            );
          })}
        </div>

        {/* Line Chart Area */}
        <div className="p-6 bg-background/50 relative">
          <div className="h-[180px] w-full flex flex-col justify-end">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-[150px] overflow-visible"
            >
              {/* Grid lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(255,255,255,0.05)" />

              {/* Area gradient under the trend line */}
              {maxVal > 0 && (
                <path 
                  d={areaD} 
                  fill={`url(#areaGrad-${activeMetric})`} 
                  className="transition-all duration-300 ease-in-out"
                />
              )}

              {/* Linear trend path */}
              {maxVal > 0 && (
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke={activeData.color} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="transition-all duration-300 ease-in-out"
                />
              )}

              {/* Interactive circular points */}
              {maxVal > 0 && coordinates.map((coord, idx) => (
                <g key={idx} className="group/node cursor-pointer">
                  {/* Outer hover ring */}
                  <circle 
                    cx={coord.x} 
                    cy={coord.y} 
                    r="8" 
                    fill={activeData.color} 
                    opacity="0" 
                    className="group-hover/node:opacity-30 transition-opacity duration-150"
                  />
                  {/* Central node dot */}
                  <circle 
                    cx={coord.x} 
                    cy={coord.y} 
                    r="4" 
                    fill={activeData.color} 
                    stroke="#1e1e1e" 
                    strokeWidth="1.5" 
                    className="transition-all duration-300 ease-in-out"
                  />
                  {/* Custom tooltip helper overlay */}
                  <title>{`${activeData.dates[idx]}: ${coord.value.toLocaleString()}`}</title>
                </g>
              ))}

              {/* Gradients definitions */}
              <defs>
                {(['views', 'profile_views', 'likes', 'comments', 'shares', 'earnings'] as const).map((metric) => {
                  const color = chartData[metric].color;
                  return (
                    <linearGradient key={metric} id={`areaGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                  );
                })}
              </defs>
            </svg>

            {/* X-Axis Labels row */}
            <div className="flex justify-between px-[50px] mt-2 text-[10px] font-semibold text-text-muted select-none">
              {activeData.dates.map((date, idx) => (
                <span key={idx} className="w-[100px] text-center first:text-left last:text-right first:w-auto last:w-auto">
                  {date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN SPLIT: RECENT POSTS vs LATEST COMMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2): RECENT POSTS */}
        <div className="lg:col-span-2 bg-background border border-elevated rounded-xl p-6 shadow-sm flex flex-col transition duration-200">
          <div className="flex items-center justify-between mb-5 border-b border-elevated pb-3">
            <Link href="/toptopstudio/manage" className="flex items-center gap-1 cursor-pointer group">
              <h3 className="font-bold text-[15px]">{t('home.recentPosts')}</h3>
              <ArrowRight size={14} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link 
              href="/toptopstudio/upload" 
              className="text-xs font-bold text-brand hover:underline"
            >
              {t('home.createPost')}
            </Link>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 flex-1">
                <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 flex-1 text-center">
                <Video size={36} className="text-text-muted mb-3" />
                <p className="text-sm font-semibold text-text-primary">{t('home.noPosts')}</p>
                <p className="text-xs text-text-secondary mt-1 max-w-[280px]">
                  {t('home.noPostsDesc')}
                </p>
                <Link 
                  href="/toptopstudio/upload"
                  className="mt-4 bg-brand hover:bg-brand/90 text-white font-bold text-xs px-4 py-2.5 rounded shadow transition"
                >
                  {t('home.uploadBtn')}
                </Link>
              </div>
            ) : (
              videos.slice(0, 3).map((video) => (
                <div 
                  key={video.id} 
                  className="flex items-center justify-between p-3.5 rounded-lg border border-elevated/40 bg-surface/10 hover:bg-hover/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-4">
                    {/* 9:16 Vertical Video Thumbnail */}
                    <div className="w-12 h-16 rounded bg-black/20 overflow-hidden relative shrink-0 border border-white/5 flex items-center justify-center">
                      {video.thumbnailUrl ? (
                        <Image 
                          src={video.thumbnailUrl} 
                          alt="" 
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Video size={16} className="text-white/30" />
                      )}
                      {/* Length badge */}
                      <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] font-bold px-1.5 py-0.5 rounded text-white select-none">
                        {video.duration ? `${Math.floor(video.duration / 60).toString().padStart(2, '0')}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:19'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary line-clamp-1 truncate">
                        {renderDescription(video.description || video.title)}
                      </p>
                      <span className="text-[11px] text-text-muted">
                        {formatTimestamp(video.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Video Performance metrics */}
                  <div className="flex items-center gap-5 text-text-secondary shrink-0 select-none">
                    <div className="flex items-center gap-1">
                      <Play size={12} className="text-text-muted" />
                      <span className="text-xs font-bold">{video.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-text-muted" />
                      <span className="text-xs font-bold">{video.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} className="text-text-muted" />
                      <span className="text-xs font-bold">{video.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (Span 1): LATEST COMMENTS */}
        <div className="lg:col-span-1 bg-background border border-elevated rounded-xl p-6 shadow-sm flex flex-col transition duration-200">
          <div className="flex items-center justify-between mb-5 border-b border-elevated pb-3">
            <div className="flex items-center gap-1 cursor-pointer group">
              <h3 className="font-bold text-[15px]">{t('home.latestComments')}</h3>
              <ArrowRight size={14} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            {mockComments.map((comment, index) => {
              const colors = ['bg-rose-500/20 text-rose-500', 'bg-blue-500/20 text-blue-500', 'bg-emerald-500/20 text-emerald-500'];
              const colorClass = colors[index % colors.length];
              
              return (
                <div 
                  key={comment.id}
                  className="flex flex-col gap-2 p-3.5 rounded-lg border border-elevated/40 bg-surface/10 hover:bg-hover/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Commenter avatar */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase select-none ${colorClass}`}>
                        {comment.author[0]}
                      </div>
                      <span className="text-xs font-bold text-text-primary">
                        {comment.author}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {comment.time}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed pl-8 pr-1 font-medium">
                    &quot;{comment.text}&quot;
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-[10px] text-brand pl-8">
                    <FileText size={10} className="shrink-0" />
                    <span className="truncate italic max-w-[200px]" title={comment.videoTitle}>
                      {comment.videoTitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
