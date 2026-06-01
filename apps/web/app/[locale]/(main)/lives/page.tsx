import React from "react";
import LiveFeedViewport from "@/components/lives/LiveFeedViewport";

export const metadata = {
  title: "LIVE - TikTok",
  description: "Watch live videos on TikTok",
};

export default function LivesPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden bg-black">
      <LiveFeedViewport />
    </div>
  );
}
