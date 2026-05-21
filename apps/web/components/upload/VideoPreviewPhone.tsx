'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VideoPreviewPhoneProps {
  previewUrl: string | null;
  previewMode: 'FEED' | 'PROFILE' | 'WEB';
  onModeChange: (mode: 'FEED' | 'PROFILE' | 'WEB') => void;
  description: string;
  username: string;
  soundTitle?: string;
  paused?: boolean;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
}

export default function VideoPreviewPhone({ previewUrl, previewMode, onModeChange, description, username, soundTitle, paused = false, trimStartSeconds, trimEndSeconds }: VideoPreviewPhoneProps) {
  const t = useTranslations('Studio.upload');
  const feedVideoRef = useRef<HTMLVideoElement>(null);
  const webVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true);

  const applyVolume = (ref: React.RefObject<HTMLVideoElement | null>, vol: number, muted: boolean) => {
    const v = ref.current;
    if (!v) return;
    v.volume = vol;
    v.muted = muted;
  };

  const togglePlay = (ref: React.RefObject<HTMLVideoElement | null>) => {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    applyVolume(feedVideoRef, val, val === 0);
    applyVolume(webVideoRef, val, val === 0);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    applyVolume(feedVideoRef, volume, next);
    applyVolume(webVideoRef, volume, next);
  };

  useEffect(() => {
    if (!paused) return;
    feedVideoRef.current?.pause();
    webVideoRef.current?.pause();
    const frameId = requestAnimationFrame(() => setIsPlaying(false));
    return () => cancelAnimationFrame(frameId);
  }, [paused]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (trimEndSeconds && trimEndSeconds > 0) {
      if (video.currentTime >= trimEndSeconds) {
        video.currentTime = trimStartSeconds || 0;
        video.play().catch(() => {});
      }
    } else if (trimStartSeconds && trimStartSeconds > 0) {
      if (video.currentTime < trimStartSeconds) {
        video.currentTime = trimStartSeconds;
        video.play().catch(() => {});
      }
    }
  };

  const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.currentTime = trimStartSeconds || 0;
    video.play().catch(() => {});
  };

  useEffect(() => {
    const feed = feedVideoRef.current;
    const web = webVideoRef.current;
    if (trimStartSeconds !== undefined && trimStartSeconds > 0) {
      if (feed && feed.currentTime < trimStartSeconds) feed.currentTime = trimStartSeconds;
      if (web && web.currentTime < trimStartSeconds) web.currentTime = trimStartSeconds;
    }
  }, [trimStartSeconds]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode Tabs */}
      <div className="flex items-center bg-surface rounded-lg p-1 border border-elevated">
        {(['FEED', 'PROFILE', 'WEB'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              previewMode === mode
                ? 'bg-background text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t(mode === 'FEED' ? 'feed' : mode === 'PROFILE' ? 'profile' : 'web')}
          </button>
        ))}
      </div>
      
      {/* Volume Controls */}
      <div className="flex items-center gap-3 w-full max-w-[270px] bg-surface rounded-lg px-3 py-2 border border-elevated">
        <button onClick={toggleMute} className="text-text-secondary hover:text-text-primary transition-colors">
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={isMuted ? 0 : volume} 
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-elevated rounded-lg appearance-none cursor-pointer accent-brand"
        />
      </div>

      {/* Phone Mockup */}
      {previewMode === 'FEED' && (
        <div className="w-full max-w-[270px] aspect-[9/16] bg-black rounded-[2.5rem] border-[6px] border-zinc-800 relative overflow-hidden shadow-2xl">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-3">
            <span className="text-white text-[10px] font-medium">8:00</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 border border-white/60 rounded-sm" />
            </div>
          </div>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-800 rounded-b-2xl z-20" />

          {previewUrl ? (
            <div className="w-full h-full relative cursor-pointer" onClick={() => togglePlay(feedVideoRef)}>
              <video ref={feedVideoRef} src={previewUrl} autoPlay={!paused} muted playsInline onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="absolute inset-0 w-full h-full object-contain" />
              {/* Play/Pause indicator */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play size={22} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
              )}
              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pb-6 pointer-events-none">
                <p className="text-white text-xs font-bold mb-0.5">@{username}</p>
                <p className="text-white/80 text-[10px] line-clamp-2">{description || '...'}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Music size={10} className="text-white/70" />
                  <div className="truncate text-white/60 text-[9px]">{soundTitle || `Original sound - @${username}`}</div>
                </div>
              </div>
              {/* Right action bar */}
              <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 pointer-events-none">
                {[
                  { icon: <Heart size={18} />, label: '0' },
                  { icon: <MessageCircle size={18} />, label: '0' },
                  { icon: <Bookmark size={16} />, label: '0' },
                  { icon: <Share2 size={16} />, label: '0' },
                ].map((a, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="text-white/80">{a.icon}</div>
                    <span className="text-white/60 text-[9px]">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
              <Play size={32} className="text-white/30 mb-2" />
              <p className="text-white/30 text-xs">{t('previewLabel')}</p>
            </div>
          )}
        </div>
      )}

      {previewMode === 'PROFILE' && (
        <div className="w-full max-w-[270px]">
          <div className="grid grid-cols-3 gap-0.5">
            <div className="aspect-[3/4] bg-zinc-900 rounded-sm overflow-hidden relative">
              {previewUrl ? (
                <>
                  <video src={previewUrl} muted onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-white text-[10px] font-medium">
                    <Play size={10} fill="white" /> 0
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={20} className="text-white/20" />
                </div>
              )}
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-[3/4] bg-zinc-800/50 rounded-sm" />
            ))}
          </div>
        </div>
      )}

      {previewMode === 'WEB' && (
        <div className="w-full max-w-[270px] rounded-xl border border-elevated overflow-hidden shadow-lg relative">
          <div className="bg-black relative cursor-pointer" onClick={() => togglePlay(webVideoRef)}>
            {previewUrl ? (
              <>
                <video ref={webVideoRef} src={previewUrl} autoPlay={!paused} muted playsInline onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="w-full h-auto block" />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play size={18} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[9/16] flex items-center justify-center">
                <Play size={32} className="text-white/20" />
              </div>
            )}
            {/* Overlay info on top of video */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-white/30" />
                <span className="text-[11px] font-bold text-white">@{username}</span>
              </div>
              <p className="text-[10px] text-white/80 line-clamp-2">{description || '...'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
