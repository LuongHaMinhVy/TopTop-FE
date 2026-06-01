"use client";

import React, { useState } from "react";
import { useCreateLivestream } from "@/hooks/live-hooks";
import { useRouter } from "next/navigation";
import { Card, Button, Input, IconButton } from "@repo/ui";

export default function LivestreamStudioPage() {
  const router = useRouter();
  const createLivestream = useCreateLivestream();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      const res = await createLivestream.mutateAsync({
        title,
        description,
        allowChat: true,
        allowGifts: true,
      });

      if (res.data?.id) {
        router.push(`/lives/studio/${res.data.id}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to create livestream");
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="p-6 relative">
        <IconButton
          icon="X"
          className="absolute top-4 right-4"
          onClick={() => router.replace("/lives")}
        />
        <h2 className="text-2xl font-bold mb-1">Creator Studio</h2>
        <p className="text-text-muted mb-6">
          Start a new livestream and broadcast to your followers
        </p>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2 flex flex-col">
            <label htmlFor="title" className="text-sm font-semibold">
              Livestream Title
            </label>
            <Input
              id="title"
              placeholder="What's happening?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <label htmlFor="description" className="text-sm font-semibold">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Tell viewers what your stream is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold bg-brand hover:bg-brand/90 text-white"
            disabled={createLivestream.isPending}
          >
            {createLivestream.isPending ? "Setting up..." : "Go Live Now"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
