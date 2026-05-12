'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Subtitles, 
  ArrowDownWideNarrow, 
  PictureInPicture, 
  HeartOff, 
  Flag,
  ChevronLeft,
  Check
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setAutoScroll } from '@/store/slices/mediaSlice';

interface VideoOptionsMenuProps {
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

type MenuMode = 'main' | 'quality';

export function VideoOptionsMenu({ onClose, videoRef }: VideoOptionsMenuProps) {
  const t = useTranslations('video');
  const dispatch = useDispatch();
  const autoScroll = useSelector((state: RootState) => state.media.autoScroll);
  
  const [mode, setMode] = useState<MenuMode>('main');
  const [quality, setQuality] = useState('1080P');

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
    { icon: <HeartOff size={20} />, label: t('notInterested') },
    { icon: <Flag size={20} />, label: t('report') },
  ], [t, quality, autoScroll, dispatch]);

  if (mode === 'quality') {
    return (
      <div className="absolute top-full right-0 mt-2 w-64 bg-background/95 backdrop-blur-2xl border border-elevated rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-visible animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
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
    <div className="absolute top-full right-0 mt-2 w-64 bg-background/95 backdrop-blur-2xl border border-elevated rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-visible animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
      {/* Small arrow at the top */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-background border-l border-t border-elevated rotate-45 z-[-1]" />
      
      <div className="flex flex-col py-1.5">
        {mainItems.map((item, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (item.action === 'pip') {
                togglePip();
              } else if (item.onToggle) {
                item.onToggle();
              } else if (item.onClick) {
                item.onClick();
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-text-primary text-left w-full group"
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
