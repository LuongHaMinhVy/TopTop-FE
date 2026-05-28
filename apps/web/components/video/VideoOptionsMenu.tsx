'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Subtitles, 
  ArrowDownWideNarrow, 
  PictureInPicture, 
  HeartOff, 
  Flag,
  Ban,
  ChevronLeft,
  Check
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setAutoScroll } from '@/store/slices/mediaSlice';
import { openAuthModal } from '@/store/slices/authSlice';
import { useNotInterestedVideoMutation } from '@/hooks/video-hooks';

interface VideoOptionsMenuProps {
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoId?: number;
  username?: string;
  description?: string;
  thumbnailUrl?: string | null;
  isLiked?: boolean;
  isSaved?: boolean;
  canBlock?: boolean;
  onReportClick?: () => void;
  onBlockClick?: () => void;
  onNotInterested?: () => void;
}

type MenuMode = 'main' | 'quality';

export function VideoOptionsMenu({
  onClose,
  videoRef,
  videoId,
  username,
  isLiked = false,
  isSaved = false,
  canBlock = false,
  onReportClick,
  onBlockClick,
  onNotInterested
}: VideoOptionsMenuProps) {
  const t = useTranslations('video');
  const dispatch = useDispatch();
  const autoScroll = useSelector((state: RootState) => state.media.autoScroll);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [mode, setMode] = useState<MenuMode>('main');
  const [quality, setQuality] = useState('1080P');

  const notInterestedMutation = useNotInterestedVideoMutation();

  const handleReport = () => {
    if (onReportClick) {
      onReportClick();
    }
    onClose();
  };

  const handleBlock = () => {
    if (onBlockClick) {
      onBlockClick();
    }
    onClose();
  };

  const handleNotInterested = () => {
    if (isLiked || isSaved) {
      onClose();
      return;
    }
    if (onNotInterested) {
      onNotInterested();
      return;
    }
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      onClose();
      return;
    }
    if (videoId) {
      notInterestedMutation.mutate(videoId);
    }
    onClose();
  };

  const togglePip = React.useCallback(async () => {
    try {
      if (videoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
    onClose();
  }, [videoRef, onClose]);

  const qualities = ['1080P', '720P', '480P', 'Auto'];

  const mainItems = React.useMemo(() => [
    { 
      icon: <Settings size={20} />, 
      label: t('quality'), 
      rightText: quality, 
      onClick: () => setMode('quality') 
    },
    { icon: <Subtitles size={20} />, label: t('captions') },
    { 
      icon: <ArrowDownWideNarrow size={20} />, 
      label: t('autoScroll'), 
      isToggle: true, 
      active: autoScroll,
      onToggle: () => dispatch(setAutoScroll(!autoScroll))
    },
    { icon: <PictureInPicture size={20} />, label: t('pip'), action: 'pip' },
    {
      icon: <HeartOff size={20} />,
      label: t('notInterested'),
      action: 'notInterested',
      disabled: isLiked || isSaved,
      rightText: isLiked || isSaved ? t('alreadyInterested') : undefined,
    },
    { icon: <Flag size={20} />, label: t('report'), action: 'report' },
    ...(canBlock ? [{ icon: <Ban size={20} />, label: `${t('blockUser')} @${username}`, action: 'block' }] : []),
  ], [t, quality, autoScroll, dispatch, canBlock, username, isLiked, isSaved]);

  if (mode === 'quality') {
    return (
      <div className="select-options-solid absolute top-full right-0 mt-2 w-64 bg-background border border-elevated rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-visible animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
        <div className="absolute -top-2 right-4 w-4 h-4 bg-background border-l border-t border-elevated rotate-45 z-[-1]" />
        
        <div className="flex flex-col py-1.5">
          <button 
            onClick={() => setMode('main')}
            className="flex items-center gap-3 px-4 py-3 border-b border-elevated hover:bg-hover transition-colors text-text-primary font-bold"
          >
            <ChevronLeft size={20} />
            <span>{t('quality')}</span>
          </button>
          
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuality(q);
                // logic to switch video source would go here
                setMode('main');
              }}
              className="flex items-center justify-between px-4 py-3 hover:bg-hover transition-colors text-text-primary text-left w-full group"
            >
              <span className={`font-medium text-[15px] ${quality === q ? 'text-brand' : ''}`}>{q}</span>
              {quality === q && <Check size={18} className="text-brand" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="select-options-solid absolute top-full right-0 mt-2 w-64 bg-background border border-elevated rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-visible animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
      {/* Small arrow at the top */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-background border-l border-t border-elevated rotate-45 z-[-1]" />
      
      <div className="flex flex-col py-1.5">
        {mainItems.map((item, index) => (
          <button
            key={index}
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (item.disabled) return;
              if (item.action === 'pip') {
                togglePip();
              } else if (item.action === 'report') {
                handleReport();
              } else if (item.action === 'block') {
                handleBlock();
              } else if (item.action === 'notInterested') {
                handleNotInterested();
              } else if (item.onToggle) {
                item.onToggle();
              } else if (item.onClick) {
                item.onClick();
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-text-primary text-left w-full group disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <div className="text-text-muted group-hover:text-text-primary transition-colors">
              {item.icon}
            </div>
            <span className="flex-1 font-medium text-[15px]">{item.label}</span>
            {item.rightText && (
              <span className="text-[13px] text-text-muted font-bold">{item.rightText}</span>
            )}
            {item.isToggle && (
              <div 
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${item.active ? 'bg-green-500' : 'bg-elevated'}`}
              >
                <div 
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${item.active ? 'left-5' : 'left-1'}`} 
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
