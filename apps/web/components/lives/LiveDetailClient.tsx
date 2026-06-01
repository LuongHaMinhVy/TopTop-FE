"use client";

import LiveKitViewer from "./LiveKitViewer";

interface LiveDetailClientProps {
  streamId: number;
}

export default function LiveDetailClient({ streamId }: LiveDetailClientProps) {
  if (!Number.isFinite(streamId)) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Live stream not found</h1>
          <p className="mt-2 text-sm text-white/60">The link is invalid or the stream is unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-black">
      <LiveKitViewer streamId={streamId} isActive />
    </div>
  );
}
