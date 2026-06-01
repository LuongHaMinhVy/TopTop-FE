"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useSendMessage } from "@/hooks/chat-hooks";
import { useRef, useState, KeyboardEvent } from "react";
import { AlertCircle, Send, Smile, Paperclip, X, Image as ImageIcon, Video, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUploadMediaMutation } from "@/hooks/media-hooks";
import NextImage from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useQueryClient } from "@tanstack/react-query";

const EMOJIS = ["😂", "🥰", "😍", "😭", "😅", "🔥", "❤️", "👏", "💀", "✨", "😎", "👍"];
const MAX_MEDIA_FILES = 9;

type MediaDraft = {
  file: File;
  previewUrl: string;
  type: "IMAGE" | "VIDEO";
  error?: string;
};

interface ChatInputProps {
  conversationId: number;
}

export const ChatInput = ({ conversationId }: ChatInputProps) => {
  const t = useTranslations('Chat');
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaDraft[]>([]);
  const [mediaError, setMediaError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sendMessage = useSendMessage();
  const uploadMedia = useUploadMediaMutation();
  const queryClient = useQueryClient();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const hasInvalidMedia = mediaFiles.some((item) => Boolean(item.error));
  const modalMediaError = mediaError || mediaFiles.find((item) => item.error)?.error || "";

  const handleSend = () => {
    if (!text.trim()) return;

    sendMessage.mutate({
      conversationId,
      type: 'TEXT',
      body: text.trim(),
      clientMessageId: crypto.randomUUID(),
    });

    setText("");
  };

  const getVideoDuration = (file: File) => {
    return new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const { duration } = video;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Không đọc được video."));
      };
      video.src = url;
    });
  };

  const handlePickMedia = async (files?: FileList | null) => {
    if (!files?.length) return;
    setMediaError("");
    const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
    if (remainingSlots <= 0) {
      setMediaError(`Chỉ được chọn tối đa ${MAX_MEDIA_FILES} ảnh hoặc video.`);
      setMediaOpen(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    const selectedFiles = Array.from(files);
    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      setMediaError(`Chỉ được chọn tối đa ${MAX_MEDIA_FILES} ảnh hoặc video.`);
    }
    const picked: MediaDraft[] = [];

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        picked.push({ file, previewUrl: URL.createObjectURL(file), type: "IMAGE" });
        continue;
      }

      if (file.type.startsWith("video/")) {
        const previewUrl = URL.createObjectURL(file);
        try {
          const duration = await getVideoDuration(file);
          picked.push({
            file,
            previewUrl,
            type: "VIDEO",
            error: duration > 15 ? "Video chỉ được tối đa 15 giây." : undefined,
          });
          if (duration > 15) {
            setMediaError("Video chỉ được tối đa 15 giây. Vui lòng xoá video này để gửi.");
          }
        } catch (error) {
          picked.push({
            file,
            previewUrl,
            type: "VIDEO",
            error: error instanceof Error ? error.message : "Video không hợp lệ.",
          });
          setMediaError(error instanceof Error ? error.message : "Video không hợp lệ.");
        }
      }
    }

    if (picked.length > 0) {
      setMediaFiles((current) => [...current, ...picked]);
      setMediaOpen(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (index: number) => {
    const removed = mediaFiles[index];
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    const next = mediaFiles.filter((_, itemIndex) => itemIndex !== index);
    setMediaFiles(next);
    if (!next.some((item) => Boolean(item.error))) {
      setMediaError("");
    }
  };

  const closeMediaModal = () => {
    mediaFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setMediaFiles([]);
    setMediaError("");
    setMediaOpen(false);
  };

  const handleSendMedia = async () => {
    if (mediaFiles.length === 0 || hasInvalidMedia) return;

    const caption = text.trim();
    const filesToUpload = [...mediaFiles];

    // Close the modal and reset states immediately
    setMediaFiles([]);
    setMediaError("");
    setText("");
    setMediaOpen(false);

    // Process files asynchronously in background
    for (let index = 0; index < filesToUpload.length; index += 1) {
      const item = filesToUpload[index];
      const clientMsgId = crypto.randomUUID();

      if (currentUserId) {
        const queryKey = ['chat', 'messages', currentUserId, conversationId];
        const optimisticMessage = {
          id: Math.round(Math.random() * -1000000), // Temp negative ID
          conversationId,
          senderId: currentUserId,
          type: item.type,
          body: index === 0 ? caption || undefined : undefined,
          status: 'SENDING',
          mine: true,
          clientMessageId: clientMsgId,
          createdAt: new Date().toISOString(),
          attachment: {
            type: item.type,
            url: item.previewUrl, // Blob URL
            fileName: item.file.name,
            fileSize: item.file.size,
          }
        };

        // Inject the optimistic message with blob url directly to UI
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) {
            return {
              pages: [{ data: [optimisticMessage], meta: { page: 0, size: 20, totalPages: 1, totalElements: 1 } }],
              pageParams: [0]
            };
          }
          return {
            ...old,
            pages: old.pages.map((page: any, idx: number) => {
              if (idx === 0) {
                return {
                  ...page,
                  data: [optimisticMessage, ...(page.data || [])]
                };
              }
              return page;
            })
          };
        });

        // Run upload & send in background
        (async () => {
          try {
            const uploadResponse = await uploadMedia.mutateAsync({ file: item.file, context: "chat" });
            const media = uploadResponse.data;
            if (!media?.url) throw new Error("File upload failed");

            await sendMessage.mutateAsync({
              conversationId,
              type: item.type,
              body: index === 0 ? caption || undefined : undefined,
              mediaUrl: media.url,
              mediaType: item.type,
              fileName: media.fileName,
              fileSize: media.fileSize,
              clientMessageId: clientMsgId,
            });

            // Successfully sent: revoke URL
            URL.revokeObjectURL(item.previewUrl);
          } catch (error) {
            console.error("Failed to upload/send media in background:", error);
            
            // Mark as FAILED in query cache
            queryClient.setQueryData(queryKey, (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  data: page.data?.map((msg: any) => 
                    msg.clientMessageId === clientMsgId 
                      ? { ...msg, status: 'FAILED' } 
                      : msg
                  )
                }))
              };
            });
          }
        })();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2 bg-elevated rounded-xl px-3 py-2">
        {emojiOpen && (
          <div className="absolute bottom-full left-2 mb-2 grid grid-cols-6 gap-1 rounded-xl border border-elevated bg-background p-2 shadow-2xl">
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" onClick={() => { setText((value) => `${value}${emoji}`); setEmojiOpen(false); }} className="grid size-8 place-items-center rounded-lg hover:bg-hover">
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setEmojiOpen((value) => !value)} className="text-text-secondary hover:text-text-primary p-1">
          <Smile size={22} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          className="flex-1 bg-transparent border-none outline-none text-[15px] py-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => handlePickMedia(e.target.files)}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-text-secondary hover:text-text-primary p-1">
          <Paperclip size={20} />
        </button>
        <button 
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className={`p-2 rounded-full transition-all ${
            text.trim() ? 'text-brand' : 'text-text-muted opacity-50'
          }`}
        >
          <Send size={20} fill={text.trim() ? "currentColor" : "none"} />
        </button>
      </div>
      {mediaOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60">
          <div className="modal-opacity-solid w-full max-w-[420px] overflow-hidden rounded-lg border border-elevated bg-background text-text-primary shadow-2xl">
            <div className="flex items-center justify-between border-b border-elevated px-7 py-6">
              <h2 className="text-[28px] font-bold">Gửi tập tin</h2>
              <button type="button" onClick={closeMediaModal} className="grid size-9 place-items-center rounded-full text-text-secondary hover:bg-hover hover:text-text-primary">
                <X size={30} />
              </button>
            </div>
            {modalMediaError && (
              <div className="mx-7 mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-[13px] font-semibold text-brand">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{modalMediaError}</span>
              </div>
            )}
            <div className="grid max-h-[360px] grid-cols-2 gap-4 overflow-y-auto px-7 py-6">
              {mediaFiles.map((item, index) => (
                <div
                  key={item.previewUrl}
                  className={`relative overflow-hidden rounded-xl bg-elevated ${item.error ? "ring-2 ring-brand" : ""}`}
                >
                  {item.type === "IMAGE" ? (
                    <NextImage
                      src={item.previewUrl}
                      alt=""
                      width={180}
                      height={180}
                      unoptimized
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <video src={item.previewUrl} className="aspect-square w-full object-cover" muted />
                  )}
                  <div className="absolute bottom-1 left-1 rounded-full bg-background/80 p-1 text-text-primary">
                    {item.type === "IMAGE" ? <ImageIcon size={14} /> : <Video size={14} />}
                  </div>
                  {item.error && (
                    <div className="absolute left-1 top-1 grid size-6 place-items-center rounded-full bg-brand text-white">
                      <AlertCircle size={14} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-black/65 text-white shadow-lg hover:bg-brand"
                    aria-label="Xoá tập tin"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-elevated px-7 py-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded border border-elevated px-5 text-[16px] font-bold hover:bg-hover"
              >
                <Plus size={18} />
                Thêm
              </button>
              <button
                type="button"
                onClick={handleSendMedia}
                disabled={mediaFiles.length === 0 || hasInvalidMedia || uploadMedia.isPending || sendMessage.isPending}
                className="h-11 rounded bg-brand px-8 text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadMedia.isPending || sendMessage.isPending ? "Đang gửi..." : `Gửi (${mediaFiles.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
