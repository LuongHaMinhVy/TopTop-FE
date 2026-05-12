"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";

export default function FeedPage() {
  return (
    <>
      <div
        className="h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {[
          { 
            index: 0, 
            videoUrl: "/1.mp4",
            username: "juxtweb",
            caption: "EVIL AURAA COME OUT! #webtoon #manhwa #webtoonrecomendation #manhwarecomendation",
            likes: "8676",
            comments: "52",
            saves: "2122",
            shares: "113"
          },
          { 
            index: 1, 
            videoUrl: "/2.mp4",
            username: "baprang4k", 
            caption: "This is a vertical video test. 📱 #vertical #toptop",
            likes: "12.5K",
            comments: "431",
            saves: "5000",
            shares: "120"
          },
          { 
            index: 2, 
            videoUrl: "/3.mp4",
            username: "baprang4k", 
            caption: "This is a vertical video test. 📱 #vertical #toptop",
            likes: "12.5K",
            comments: "431",
            saves: "5000",
            shares: "120"
          },
          {
            index: 3,
            videoUrl: "/4.mp4",
            username: "baprang4k",
            caption: "This is a vertical video test. 📱 #vertical #toptop",
            likes: "12.5K",
            comments: "431",
            saves: "5000",
            shares: "120"
          }
        ].map((v) => (
          <VideoCard key={v.index} {...v} />
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-5 bottom-32 flex flex-col gap-2 z-40 hidden xl:flex">
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}
