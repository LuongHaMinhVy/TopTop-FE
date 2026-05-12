'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2, ExternalLink, Video } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

export default function ContentManagementPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['user-videos', user?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/videos/user/${user?.id}`);
      return response.data.data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      await axios.delete(`/api/v1/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-videos', user?.id] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium">Loading your content...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Video Content</h1>
        <p className="text-zinc-500">Manage your uploaded videos</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Video</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Views</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Likes</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Comments</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {!videos || videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-zinc-500">
                     No videos found. Start by uploading one!
                  </td>
                </tr>
              ) : (
                videos.map((video: any) => (
                  <tr key={video.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-14 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {video.thumbnailUrl ? (
                              <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                                  <Video className="text-zinc-400" size={20} />
                              </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate max-w-[200px]">{video.title}</span>
                          <span className="text-xs text-zinc-500 truncate max-w-[200px]">{video.description || 'No description'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {video.createdAt ? format(new Date(video.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {video.viewCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {video.likeCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {video.commentCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => window.open(video.fileUrl, '_blank')}
                          title="Open Video"
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                         >
                           <ExternalLink size={18} />
                         </button>
                         <button 
                          onClick={() => handleDelete(video.id)}
                          title="Delete Video"
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
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
