'use client';

import React, { useCallback } from 'react';
import { Upload, Film, Clock, Monitor, Maximize } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  errorMessage: string;
}

export default function UploadDropzone({ onFileSelect, errorMessage }: UploadDropzoneProps) {
  const t = useTranslations('Studio.upload');
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const infoItems = [
    { icon: <Clock size={20} className="text-text-muted" />, title: t('infoSize'), desc: t('infoSizeDesc') },
    { icon: <Film size={20} className="text-text-muted" />, title: t('infoFormat'), desc: t('infoFormatDesc') },
    { icon: <Monitor size={20} className="text-text-muted" />, title: t('infoResolution'), desc: t('infoResolutionDesc') },
    { icon: <Maximize size={20} className="text-text-muted" />, title: t('infoAspect'), desc: t('infoAspectDesc') },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-20 px-8 transition-all cursor-pointer ${
          isDragging
            ? 'border-brand bg-brand/5'
            : 'border-elevated hover:border-text-muted bg-surface'
        }`}
        onClick={() => document.getElementById('video-upload-input')?.click()}
      >
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-6">
          <Upload size={28} className="text-text-muted" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('selectFile')}</h2>
        <p className="text-sm text-text-secondary mb-8">{t('dragHint')}</p>
        <button
          type="button"
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-2.5 rounded-md transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById('video-upload-input')?.click();
          }}
        >
          {t('selectBtn')}
        </button>
        <input
          id="video-upload-input"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mt-3 font-medium">{errorMessage}</p>
      )}

      {/* Info Cards - like TikTok */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-6">
        {infoItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">{item.title}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
