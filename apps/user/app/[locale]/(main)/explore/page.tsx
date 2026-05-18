"use client";

import { useTranslations } from "next-intl";
import { useAllVideos } from "@/hooks/video-hooks";
import Image from "next/image";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { videoPath } from "@/utils/video-url";

export default function ExplorePage() {
  const t = useTranslations('Main');
  const { data, isLoading } = useAllVideos();
  const videos = data?.data ?? [];
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <header className="mb-6">
        <h1 className="text-[24px] font-bold mb-2">{t('sidebar.explore')}</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {["Trending", "Music", "Dance", "Gaming", "Food", "Fashion"].map(tag => (
            <button 
              key={tag}
              className="px-4 py-1.5 rounded-full bg-elevated/50 hover:bg-elevated text-[14px] font-semibold transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-elevated animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map(video => (
            <div 
              key={video.id}
              className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group bg-black"
              onClick={() => router.push(videoPath(video.username, video.id, { from: "explore" }))}
            >
              <Image 
                src={video.thumbnailUrl || video.fileUrl} 
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
                <Play className="w-4 h-4 fill-white" />
                <span className="text-[12px] font-bold">{video.viewCount}</span>
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : "0:15"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
