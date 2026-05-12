'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Trash2, ExternalLink, Video } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useUserVideos, useDeleteVideoMutation } from '@/hooks/video-hooks';
import type { Video } from '@/types/video';

export default function ContentManagementPage() {
  const t = useTranslations('Studio.manage');
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { data: videoResponse, isLoading } = useUserVideos(user?.id);
  const videos = videoResponse?.data;

  const deleteMutation = useDeleteVideoMutation(user?.id);

  const handleDelete = (id: number) => {
    if (window.confirm(t('table.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface border-b border-elevated">
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.video')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.status')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.date')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.views')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.likes')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted">{t('table.comments')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-elevated">
              {!videos || videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-text-muted">
                     {t('table.empty')}
                  </td>
                </tr>
              ) : (
                videos.map((video: Video) => (
                  <tr key={video.id} className="hover:bg-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-14 bg-surface rounded overflow-hidden flex-shrink-0 border border-elevated">
                          {video.thumbnailUrl ? (
                              <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface">
                                  <Video className="text-text-muted" size={20} />
                              </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate max-w-[200px] text-text-primary">{video.title}</span>
                          <span className="text-xs text-text-muted truncate max-w-[200px]">{video.description || 'No description'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        {t('table.published')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {video.createdAt ? format(new Date(video.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {video.viewCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {video.likeCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {video.commentCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => window.open(video.fileUrl, '_blank')}
                          title="Open Video"
                          className="p-2 hover:bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                         >
                           <ExternalLink size={18} />
                         </button>
                         <button 
                          onClick={() => handleDelete(video.id)}
                          title="Delete Video"
                          className="p-2 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
