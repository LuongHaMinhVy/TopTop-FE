"use client";

import { FormEvent, useState } from "react";
import { Check, FolderPlus, Loader2, X } from "lucide-react";
import {
  useAddVideoToCollectionMutation,
  useCollections,
  useCreateCollectionMutation,
} from "@/hooks/collection-hooks";
import { useTranslations } from "next-intl";

interface AddToCollectionModalProps {
  isOpen: boolean;
  videoId: number;
  onClose: () => void;
}

export function AddToCollectionModal({
  isOpen,
  videoId,
  onClose,
}: AddToCollectionModalProps) {
  const t = useTranslations("Collection");
  const { data: collectionsRes, isLoading } = useCollections(isOpen);
  const createCollectionMutation = useCreateCollectionMutation();
  const addVideoMutation = useAddVideoToCollectionMutation();
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const collections = collectionsRes?.data ?? [];

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const created = await createCollectionMutation.mutateAsync({ name: trimmedName });
    const collectionId = created.data?.id;
    if (collectionId) {
      setSelectedId(collectionId);
      await addVideoMutation.mutateAsync({ collectionId, videoId });
      setName("");
    }
  };

  const handleAdd = async (collectionId: number) => {
    setSelectedId(collectionId);
    await addVideoMutation.mutateAsync({ collectionId, videoId });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-[420px] rounded-t-2xl bg-background text-text-primary shadow-2xl sm:rounded-2xl">
        <div className="flex h-14 items-center justify-between border-b border-elevated px-4">
          <h2 className="text-[17px] font-bold">{t("addToCollection")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full hover:bg-hover"
            aria-label={t("close")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-text-muted">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="flex flex-col gap-1">
              {collections.map((collection) => {
                const isPending = addVideoMutation.isPending && selectedId === collection.id;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAdd(collection.id)}
                    className="flex h-14 items-center gap-3 rounded-lg px-3 text-left hover:bg-hover disabled:opacity-60"
                  >
                    <div className="grid size-10 place-items-center rounded-md bg-elevated">
                      {isPending ? <Loader2 className="size-5 animate-spin" /> : <FolderPlus className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{collection.name}</p>
                      <p className="text-[12px] text-text-muted">
                        {t("videoCount", { count: collection.videoCount })}
                      </p>
                    </div>
                    {selectedId === collection.id && !isPending && <Check className="size-5 text-brand" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-[14px] text-text-muted">{t("emptyCollections")}</p>
          )}
        </div>

        <form onSubmit={handleCreate} className="flex gap-2 border-t border-elevated p-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder={t("newCollectionPlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-md bg-elevated px-3 text-[14px] outline-none focus:ring-2 focus:ring-brand/50"
          />
          <button
            type="submit"
            disabled={!name.trim() || createCollectionMutation.isPending || addVideoMutation.isPending}
            className="h-11 rounded-md bg-brand px-4 text-[14px] font-bold text-white disabled:opacity-50"
          >
            {createCollectionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t("create")}
          </button>
        </form>
      </div>
    </div>
  );
}
