'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import axios from 'axios';
import { useUploadVideoMutation } from '@/hooks/video-hooks';
import { RefreshCw, Hash, AtSign, CheckCircle2, AlertCircle, ChevronDown, X, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useHashtagSuggestions, useMentionSuggestions } from '@/hooks/suggestion-hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import type { HashtagSuggestion } from '@/types/hashtag';
import type { MentionSuggestion } from '@/types/mention';
import UploadDropzone from '@/components/upload/UploadDropzone';
import VideoPreviewPhone from '@/components/upload/VideoPreviewPhone';
import { useRouter } from 'next/navigation';

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'uploaded' | 'success' | 'error';

export default function UploadVideo() {
  const t = useTranslations('Studio.upload');
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  // Navigation Guard State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Settings
  const [visibility, setVisibility] = useState('PUBLIC');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [previewMode, setPreviewMode] = useState<'FEED' | 'PROFILE' | 'WEB'>('FEED');

  // Suggestion dropdowns
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const descRef = useRef<HTMLTextAreaElement>(null);

  const debouncedHashtagSearch = useDebounce(hashtagSearch, 300);
  const debouncedMentionSearch = useDebounce(mentionSearch, 300);
  const { data: hashtagRes, isLoading: loadingHashtags } = useHashtagSuggestions(debouncedHashtagSearch, showHashtagDropdown);
  const { data: mentionRes, isLoading: loadingMentions } = useMentionSuggestions(debouncedMentionSearch, showMentionDropdown);
  const hashtags = hashtagRes?.data || [];
  const mentions = mentionRes?.data || [];

  const ffmpegRef = useRef<FFmpeg | null>(null);
  if (ffmpegRef.current == null) ffmpegRef.current = new FFmpeg();
  const uploadMutation = useUploadVideoMutation();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    // 1. Native browser prompt for closing tab/refreshing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (file && status !== 'success') {
        const message = 'Bạn có chắc chắn muốn rời khỏi trang? Video chưa được lưu sẽ bị mất.';
        e.returnValue = message;
        return message;
      }
    };
    
    // 2. Custom modal for internal client-side navigation
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (!target) return;
      
      const href = target.getAttribute('href');
      // Intercept internal links only
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        if (file && status !== 'success') {
          e.preventDefault();
          e.stopPropagation();
          setPendingUrl(href);
          setShowLeaveModal(true);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [file, status]);

  // Upload logic
  const doUpload = async (fileToProcess: File, metadata?: { title: string; description: string; visibility: string; allowComments: boolean; allowEdit: boolean }) => {
    try {
      let fileToUpload = fileToProcess;
      if (fileToProcess.size > 10 * 1024 * 1024) {
        setStatus('compressing');
        setProgress(0);
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg && !ffmpeg.loaded) {
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
        }
        if (ffmpeg) {
          ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
          await ffmpeg.writeFile('input.mp4', await fetchFile(fileToProcess));
          await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '30', '-preset', 'veryfast', 'output.mp4']);
          const data = await ffmpeg.readFile('output.mp4');
          const blobPart = typeof data === 'string' ? data : new Uint8Array(data);
          fileToUpload = new File([blobPart], fileToProcess.name, { type: 'video/mp4' });
        }
      }
      setStatus('uploading');
      setProgress(0);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      const finalMetadata = metadata || { 
        title: fileToProcess.name, 
        description: '', 
        visibility: 'PUBLIC', 
        allowComments: true, 
        allowEdit: false 
      };
      
      formData.append('data', new Blob([JSON.stringify(finalMetadata)], { type: 'application/json' }));
      if (coverFile) formData.append('cover', coverFile);

      await uploadMutation.mutateAsync({
        formData,
        onProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100)));
        }
      });
      setStatus('success'); // Change to success directly if called from handlePost?
      // Actually, let's just keep it as 'uploaded' and let handlePost finish if needed.
      // But TikTok style is that Post button triggers everything if it wasn't auto-uploaded.
      setStatus('success');
    } catch (error: unknown) {
      console.error(error);
      setStatus('error');
      setErrorMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Upload failed' : 'Upload failed');
      throw error; // Re-throw so handlePost knows it failed
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage(t('errorVideo'));
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setErrorMessage('');
    // Auto-upload is now disabled as requested
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace video
  const handleReplace = () => {
    document.getElementById('video-replace-input')?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (newFile && newFile.type.startsWith('video/')) {
      if (preview) URL.revokeObjectURL(preview);
      setFile(newFile);
      setPreview(URL.createObjectURL(newFile));
      setStatus('idle');
      setProgress(0);
      // Auto-upload is now disabled as requested
    }
  };

  // Description with hashtag/mention detection
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 4000) return;
    setDescription(value);
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    if (lastWord.startsWith('#') && lastWord.length >= 1) {
      setShowHashtagDropdown(true); setShowMentionDropdown(false);
      setHashtagSearch(lastWord.slice(1).toLowerCase());
    } else if (lastWord.startsWith('@') && lastWord.length >= 1) {
      setShowMentionDropdown(true); setShowHashtagDropdown(false);
      setMentionSearch(lastWord.slice(1).toLowerCase());
    } else {
      setShowHashtagDropdown(false); setShowMentionDropdown(false);
    }
  };

  const insertToken = (token: string, prefix: string) => {
    const words = description.split(/\s+/);
    words.pop();
    setDescription([...words, `${prefix}${token} `].join(' ').trimStart());
    setShowHashtagDropdown(false); setShowMentionDropdown(false);
    descRef.current?.focus();
  };

  const openHashtagMode = () => {
    setDescription(prev => prev + (prev.endsWith(' ') || !prev ? '#' : ' #'));
    setShowHashtagDropdown(true); setShowMentionDropdown(false);
    setHashtagSearch('');
    descRef.current?.focus();
  };

  const openMentionMode = () => {
    setDescription(prev => prev + (prev.endsWith(' ') || !prev ? '@' : ' @'));
    setShowMentionDropdown(true); setShowHashtagDropdown(false);
    setMentionSearch('');
    descRef.current?.focus();
  };

  // Submit post
  const handlePost = async () => {
    if (!file) return;
    
    try {
      await doUpload(file, {
        title: file.name,
        description,
        visibility,
        allowComments,
        allowEdit: allowDuet
      });
    } catch {
      // Error handled in doUpload
    }
  };

  const resetAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setFile(null); setPreview(null); setDescription(''); setStatus('idle');
    setProgress(0); setErrorMessage(''); setCoverFile(null); setCoverPreview(null);
    setVisibility('PUBLIC'); setAllowComments(true); setAllowDuet(true); setAllowStitch(true);
  };

  // ============= PHASE 1: DROPZONE =============
  if (!file) {
    return <UploadDropzone onFileSelect={handleFileSelect} errorMessage={errorMessage} />;
  }

  // ============= PHASE 2: EDIT FORM (TikTok-style) =============
  const isUploading = status === 'uploading' || status === 'compressing';

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* SUCCESS OVERLAY */}
      {status === 'success' && (
        <div className="bg-background rounded-xl border border-elevated p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('successTitle')}</h2>
          <p className="text-text-secondary mb-6">{t('successMsg')}</p>
          <button onClick={resetAll} className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
            {t('uploadNext')}
          </button>
        </div>
      )}

      {status !== 'success' && (
        <>
          {/* FILE HEADER - like TikTok */}
          <div className="bg-background rounded-xl border border-elevated p-5 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-text-primary truncate">{file.name}</span>
                {status === 'uploaded' && (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium flex-shrink-0">
                    <CheckCircle2 size={14} />
                    {t('uploaded')} ({formatFileSize(file.size)})
                  </span>
                )}
                {isUploading && (
                  <span className="text-sm text-text-muted flex-shrink-0">
                    {formatFileSize(file.size)} &middot; {progress}%
                  </span>
                )}
                {status === 'error' && (
                  <span className="flex items-center gap-1 text-red-500 text-sm flex-shrink-0">
                    <AlertCircle size={14} /> {errorMessage}
                  </span>
                )}
              </div>
              {status === 'uploaded' && (
                <button onClick={handleReplace} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors flex-shrink-0">
                  <RefreshCw size={14} /> {t('replace')}
                </button>
              )}
              <input id="video-replace-input" type="file" accept="video/*" className="hidden" onChange={handleReplaceFile} />
            </div>
            {/* Progress bar */}
            {(isUploading || status === 'uploaded') && (
              <div className="w-full h-1 bg-elevated rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: status === 'uploaded' ? '#22c55e' : 'linear-gradient(90deg, #25F4EE, #FE2C55)',
                  }}
                />
              </div>
            )}
          </div>

          {/* MAIN CONTENT: Two columns - responsive */}
          <div className="flex flex-col-reverse lg:flex-row gap-6 mt-6">
            {/* LEFT: Form */}
            <div className="flex-1 min-w-0">
              {/* Details Section */}
              <h3 className="text-base font-bold text-text-primary mb-4">{t('details')}</h3>

              {/* Description */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('description')}</label>
                <div className="relative">
                  <div className="border border-elevated rounded-lg bg-background focus-within:border-text-muted transition-colors">
                    <textarea
                      ref={descRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      placeholder={t('descriptionPlaceholder')}
                      rows={5}
                      maxLength={4000}
                      className="w-full px-4 py-3 bg-transparent outline-none resize-none text-text-primary text-sm"
                    />
                    {/* Bottom bar with # @ and char count */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-elevated">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={openHashtagMode} className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded transition-colors">
                          <Hash size={14} /> {t('hashtag')}
                        </button>
                        <button type="button" onClick={openMentionMode} className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded transition-colors">
                          <AtSign size={14} /> {t('mention')}
                        </button>
                      </div>
                      <span className="text-xs text-text-muted">{description.length}/4000</span>
                    </div>
                  </div>

                  {/* Hashtag Dropdown */}
                  {showHashtagDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-elevated rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                      {loadingHashtags ? (
                        <div className="p-4 text-center text-sm text-text-muted">Loading...</div>
                      ) : hashtags.length === 0 ? (
                        <div className="p-4 text-center text-sm text-text-muted">No hashtags found</div>
                      ) : hashtags.map((tag: HashtagSuggestion) => (
                        <button key={tag.id} onClick={() => insertToken(tag.name, '#')} className="w-full px-4 py-2.5 hover:bg-hover flex justify-between items-center text-left transition-colors">
                          <span className="font-semibold text-sm">#{tag.name}</span>
                          <span className="text-xs text-text-muted">{tag.formattedPostCount} posts</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mention Dropdown */}
                  {showMentionDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-elevated rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                      {loadingMentions ? (
                        <div className="p-4 text-center text-sm text-text-muted">Loading...</div>
                      ) : mentions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-text-muted">No users found</div>
                      ) : mentions.map((u: MentionSuggestion) => (
                        <button key={u.id} onClick={() => insertToken(u.username, '@')} className="w-full px-4 py-2.5 hover:bg-hover flex items-center gap-3 text-left transition-colors">
                          {u.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold">{u.username[0].toUpperCase()}</div>
                          )}
                          <div>
                            <p className="text-sm font-semibold flex items-center gap-1">{u.displayName} {u.verified && <CheckCircle2 size={12} className="text-cyan" />}</p>
                            <p className="text-xs text-text-muted">@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cover */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('cover')}</label>
                <div className="flex gap-3">
                  {coverPreview ? (
                    <div className="relative w-[120px] h-[160px] rounded-lg overflow-hidden border border-elevated">
                      <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
                      <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1">
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-medium">
                        {t('editCover')}
                      </div>
                    </div>
                  ) : preview ? (
                    <label className="relative w-[120px] h-[160px] rounded-lg overflow-hidden border border-elevated cursor-pointer group">
                      <video src={preview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-medium">
                        {t('editCover')}
                      </div>
                      <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                  ) : null}
                </div>
              </div>

              {/* DIVIDER */}
              <hr className="border-elevated mb-6" />

              {/* SETTINGS */}
              <h3 className="text-base font-bold text-text-primary mb-4">{t('settings')}</h3>

              {/* Visibility */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-text-primary mb-2 block">{t('whoCanWatch')}</label>
                <div className="relative w-56">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-elevated rounded-lg text-sm text-text-primary appearance-none pr-10 focus:outline-none focus:border-text-muted transition-colors"
                  >
                    <option value="PUBLIC">{t('everyone')}</option>
                    <option value="FRIENDS">{t('friends')}</option>
                    <option value="PRIVATE">{t('onlyMe')}</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 mb-8">
                {[
                  { label: t('allowComments'), value: allowComments, onChange: setAllowComments },
                  { label: t('allowDuet'), value: allowDuet, onChange: setAllowDuet },
                  { label: t('allowStitch'), value: allowStitch, onChange: setAllowStitch },
                ].map((toggle, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{toggle.label}</span>
                    <button
                      type="button"
                      onClick={() => toggle.onChange(!toggle.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${toggle.value ? 'bg-brand' : 'bg-elevated'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${toggle.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 mb-6">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {/* BOTTOM ACTION BAR */}
              <div className="flex items-center gap-3 pt-4 border-t border-elevated">
                <button
                  onClick={handlePost}
                  disabled={!file || uploadMutation.isPending}
                  className="bg-brand hover:bg-brand-dark disabled:bg-elevated disabled:text-text-muted text-white font-semibold px-8 py-2.5 rounded-md transition-colors"
                >
                  {t('postBtn')}
                </button>
                <button onClick={resetAll} className="px-6 py-2.5 border border-elevated rounded-md text-sm font-medium text-text-secondary hover:bg-hover transition-colors">
                  {t('saveDraft')}
                </button>
                <button onClick={resetAll} className="px-6 py-2.5 border border-elevated rounded-md text-sm font-medium text-text-secondary hover:bg-hover transition-colors">
                  {t('cancel')}
                </button>
              </div>
            </div>

            {/* RIGHT: Preview — visible on all screens */}
            <div className="w-full lg:w-[300px] flex-shrink-0">
              <VideoPreviewPhone
                previewUrl={preview}
                previewMode={previewMode}
                onModeChange={setPreviewMode}
                description={description}
                username={user?.username || 'you'}
              />
            </div>
          </div>
        </>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-elevated rounded-xl shadow-2xl w-[90%] max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-text-primary mb-2">Bỏ bản nháp?</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Bạn có một video chưa được đăng. Nếu rời khỏi trang này, toàn bộ thay đổi của bạn sẽ bị mất và video sẽ không được lưu.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingUrl(null);
                }}
                className="px-6 py-2.5 rounded-md font-semibold text-text-primary hover:bg-elevated transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button 
                onClick={() => {
                  setShowLeaveModal(false);
                  if (pendingUrl) {
                    router.push(pendingUrl);
                  }
                }}
                className="px-6 py-2.5 rounded-md font-semibold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
              >
                Rời đi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
