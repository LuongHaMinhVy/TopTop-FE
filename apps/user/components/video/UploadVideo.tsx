'use client';

import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import axios from 'axios';
import { useUploadVideoMutation } from '@/hooks/video-hooks';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Play, Film, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';

export default function UploadVideo() {
  const t = useTranslations('Studio.upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const ffmpegRef = useRef<FFmpeg | null>(null);
  
  if (ffmpegRef.current == null) {
    ffmpegRef.current = new FFmpeg();
  }

  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setErrorMessage(t('errorVideo'));
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setErrorMessage('');
    }
  };

  const compressVideo = async (input: File): Promise<File> => {
    setStatus('compressing');
    setProgress(0);
    let ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !ffmpeg.loaded) {
      await loadFFmpeg();
      ffmpeg = ffmpegRef.current;
    }

    if (!ffmpeg) {
      throw new Error('FFmpeg failed to initialize');
    }
    
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(input));

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', 'scale=-2:720',
      '-c:v', 'libx264',
      '-crf', '30',
      '-preset', 'veryfast',
      'output.mp4'
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    const blobPart = typeof data === 'string' ? data : new Uint8Array(data);
    const compressedFile = new File([blobPart], input.name, { type: 'video/mp4' });
    
    return compressedFile;
  };

  const uploadMutation = useUploadVideoMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    try {
      let fileToUpload = file;
      if (file.size > 10 * 1024 * 1024) {
        fileToUpload = await compressVideo(file);
      }

      setStatus('uploading');
      setProgress(0);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('data', new Blob([JSON.stringify({
        title,
        description,
        category
      })], { type: 'application/json' }));

      await uploadMutation.mutateAsync({
        formData,
        onProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setProgress(percentCompleted);
        }
      });

      setStatus('success');
    } catch (error: unknown) {
      console.error(error);
      setStatus('error');
      const message = axios.isAxiosError(error) ? error.response?.data?.message : 'Upload failed';
      setErrorMessage(message || 'Upload failed. The file might still be too large after compression.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Preview Phone Mockup */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-zinc-800 dark:border-zinc-700 relative overflow-hidden shadow-2xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 dark:border-zinc-700 rounded-b-2xl z-20" />
            
            {preview ? (
              <div className="w-full h-full relative">
                <video src={preview} autoPlay loop muted className="w-full h-full object-cover" />
                
                {/* Overlay UI Mockup */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none flex flex-col justify-end p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-full bg-zinc-400 border border-white/50" />
                     <div className="h-4 w-24 bg-white/40 rounded" />
                   </div>
                   <div className="h-3 w-48 bg-white/30 rounded mb-1" />
                   <div className="h-3 w-32 bg-white/20 rounded" />
                </div>
                
                {/* Interaction Overlay */}
                <div className="absolute right-2 bottom-32 flex flex-col gap-4 opacity-70">
                   {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md" />)}
                </div>

                <button 
                  onClick={() => { setFile(null); setPreview(null); setStatus('idle'); }}
                  className="absolute top-10 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition pointer-events-auto z-30"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mb-4 text-text-muted">
                  <Play size={32} />
                </div>
                <p className="text-sm font-medium text-text-secondary">{t('previewLabel')}</p>
              </div>
            )}

            {/* Upload Overlay */}
            {(status === 'compressing' || status === 'uploading') && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <div className="relative w-24 h-24 mb-6">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-elevated" />
                     <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-brand transition-all duration-300" 
                       strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} 
                     />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{progress}%</span>
                   </div>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                   {status === 'compressing' ? t('compressing') : t('uploading')}
                </h3>
                <p className="text-white/60 text-sm">
                   {status === 'compressing' ? t('compressingHint') : t('uploadingHint')}
                </p>
                <div className="mt-8 flex items-center gap-2 text-brand animate-pulse">
                   <Loader2 className="animate-spin" size={16} />
                   <span className="text-xs font-bold uppercase tracking-wider">{t('pleaseWait')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Form & Dropzone */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!file ? (
            <div className="w-full min-h-[400px] border-2 border-dashed border-elevated rounded-3xl bg-surface flex flex-col items-center justify-center p-12 transition-all hover:bg-hover group">
              <input 
                type="file" 
                id="video-upload" 
                className="hidden" 
                accept="video/*" 
                onChange={handleFileChange}
              />
              <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-background rounded-3xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-brand" size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('selectFile')}</h2>
                <p className="text-text-secondary mb-8">{t('dragHint')}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                   <div className="bg-background p-3 rounded-2xl border border-elevated flex items-center gap-3">
                      <Film className="text-blue-500" size={18} />
                      <div className="text-left">
                         <p className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Format</p>
                         <p className="text-xs font-bold">MP4, WebM</p>
                      </div>
                   </div>
                   <div className="bg-background p-3 rounded-2xl border border-elevated flex items-center gap-3">
                      <Sparkles className="text-amber-500" size={18} />
                      <div className="text-left">
                         <p className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Limit</p>
                         <p className="text-xs font-bold">Up to 1GB</p>
                      </div>
                   </div>
                </div>
                
                <Button 
                  type="button"
                  size="lg"
                  className="mt-10"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  {t('selectBtn')}
                </Button>
              </label>
            </div>
          ) : (
            <Card 
              className="animate-in slide-in-from-right duration-500"
              title={t('editInfo')}
              footer={
                status === 'idle' && (
                  <Button 
                    type="submit"
                    size="xl"
                    className="w-full"
                    form="upload-form"
                  >
                    {t('postBtn')}
                  </Button>
                )
              }
            >
              <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                <Input 
                  label={t('title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">{t('description')}</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={4}
                    className="w-full px-6 py-4 bg-surface border border-elevated rounded-2xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all duration-200 resize-none text-text-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">{t('category')}</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-6 py-4 bg-surface border border-elevated rounded-2xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all duration-200 appearance-none text-text-primary"
                    >
                      <option value="">{t('selectCat')}</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="gaming">Gaming</option>
                      <option value="education">Education</option>
                      <option value="music">Music</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">{t('status')}</label>
                    <div className="px-6 py-4 bg-surface rounded-2xl flex items-center justify-between h-[58px] border border-elevated">
                       <span className="font-bold text-text-secondary">{(file!.size / (1024 * 1024)).toFixed(2)} MB</span>
                       {file!.size > 10 * 1024 * 1024 ? (
                         <Badge variant="warning">{t('autoCompress')}</Badge>
                       ) : (
                         <Badge variant="success">{t('ready')}</Badge>
                       )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {status === 'success' && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">{t('successTitle')}</h3>
                        <p className="text-green-600/70 dark:text-green-400/70 mt-1">{t('successMsg')}</p>
                      </div>
                      <Button 
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => { setFile(null); setPreview(null); setTitle(''); setStatus('idle'); }}
                      >
                        {t('uploadNext')}
                      </Button>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                         <p className="font-bold text-red-600 dark:text-red-400">{errorMessage}</p>
                         <button onClick={() => setStatus('idle')} className="text-sm font-bold text-red-500 hover:underline mt-1 italic">Try again</button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
