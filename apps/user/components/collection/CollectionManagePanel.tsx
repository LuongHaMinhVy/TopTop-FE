"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bookmark, Check, Loader2, PlusCircle, X } from "lucide-react";
import {
  useAddVideoToCollectionMutation,
  useCollections,
  useCreateCollectionMutation,
} from "@/hooks/collection-hooks";
import { useTranslations } from "next-intl";

interface CollectionManagePanelProps {
  isOpen: boolean;
  videoId: number;
  panelStyle?: React.CSSProperties;
  onClose: () => void;
}

export function CollectionManagePanel({
  isOpen,
  videoId,
  panelStyle,
  onClose,
}: CollectionManagePanelProps) {
  const t = useTranslations("Collection");
  const { data: collectionsRes, isLoading } = useCollections(isOpen);
  const addVideoMutation = useAddVideoToCollectionMutation();
  const createCollectionMutation = useCreateCollectionMutation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || isCreateOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCreateOpen, isOpen, onClose]);

  if (!isOpen) return null;

  const collections = collectionsRes?.data ?? [];

  const handleAdd = async (collectionId: number) => {
    setSelectedId(collectionId);
    await addVideoMutation.mutateAsync({ collectionId, videoId });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const created = await createCollectionMutation.mutateAsync({ name: trimmedName, isPublic });
    const collectionId = created.data?.id;
    if (collectionId) {
      setSelectedId(collectionId);
      await addVideoMutation.mutateAsync({ collectionId, videoId });
    }

    setName("");
    setIsPublic(false);
    setIsCreateOpen(false);
  };

  return (
    <>
      <div
        ref={panelRef}
        className="absolute z-[220] hidden w-[248px] overflow-hidden rounded-lg border border-white/15 bg-[#3f3f3f] text-white shadow-2xl sm:block"
        style={panelStyle}
      >
        <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 text-[14px] font-bold hover:bg-white/15"
          >
            <PlusCircle className="size-4" />
            {t("createNewCollection")}
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-white/70">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="flex flex-col gap-1">
              {collections.map((collection) => {
                const isPending = addVideoMutation.isPending && selectedId === collection.id;
                const isSelected = selectedId === collection.id && !isPending;

                return (
                  <button
                    key={collection.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAdd(collection.id)}
                    className="flex h-12 w-full items-center gap-2.5 rounded-md px-2 text-left hover:bg-white/10 disabled:opacity-60"
                  >
                    <div className="grid size-9 flex-shrink-0 place-items-center rounded-md bg-white/15 text-white/70">
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isSelected ? (
                        <Check className="size-4 text-brand" />
                      ) : (
                        <Bookmark className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{collection.name}</p>
                      <p className="truncate text-[12px] font-semibold text-white/45">
                        {t("videoCount", { count: collection.videoCount })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-7 text-center text-[13px] font-semibold text-white/55">
              {t("emptyCollections")}
            </p>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 px-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-[450px] rounded-xl bg-[#222] p-7 text-white shadow-2xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <h2 className="flex-1 text-center text-[22px] font-bold">{t("newCollectionTitle")}</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="grid size-8 place-items-center rounded-full text-white hover:bg-white/10"
                aria-label={t("close")}
              >
                <X className="size-7" />
              </button>
            </div>

            <label className="mb-3 block text-[16px] font-bold">
              {t("name")} <span className="font-semibold text-white/50">({name.length}/30)</span>
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 30))}
              placeholder={t("newCollectionPlaceholder")}
              className="mb-8 h-[60px] w-full rounded-lg bg-white/10 px-5 text-[18px] font-semibold outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20"
            />

            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <p className="text-[18px] font-bold">{t("makePublic")}</p>
                <p className="mt-2 text-[14px] font-semibold leading-snug text-white/45">
                  {t("makePublicDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((value) => !value)}
                className={`relative mt-1 h-9 w-[60px] flex-shrink-0 rounded-full transition ${
                  isPublic ? "bg-brand" : "bg-white/20"
                }`}
                aria-pressed={isPublic}
              >
                <span
                  className={`absolute top-1 size-7 rounded-full bg-white transition ${
                    isPublic ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || createCollectionMutation.isPending || addVideoMutation.isPending}
              className="h-[50px] w-full rounded-md bg-brand text-[18px] font-bold text-white disabled:bg-brand/50 disabled:text-white/45"
            >
              {createCollectionMutation.isPending ? (
                <Loader2 className="mx-auto size-5 animate-spin" />
              ) : (
                t("save")
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
