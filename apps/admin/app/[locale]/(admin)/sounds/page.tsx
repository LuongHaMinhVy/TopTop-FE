"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SoundsSection } from "@/components/dashboard/SoundsSection";
import { SoundModal } from "@/components/dashboard/SoundModal";
import { SoundDeleteModal } from "@/components/dashboard/SoundDeleteModal";
import { getAdminSounds } from "@/services/sound-api-service";
import type { SoundItem } from "@/types/admin";

const emptySoundItems: SoundItem[] = [];

export default function AdminSoundsPage() {
  const [soundKeyword, setSoundKeyword] = useState("");
  const [soundPage, setSoundPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(null);
  const [deleteSound, setDeleteSound] = useState<SoundItem | null>(null);

  const queryClient = useQueryClient();

  const soundsQuery = useQuery({
    queryKey: ["admin", "sounds", soundKeyword, soundPage],
    queryFn: () =>
      getAdminSounds({
        keyword: soundKeyword.trim() || undefined,
        page: soundPage,
        size: 15,
      }),
  });

  const soundItems = soundsQuery.data?.data ?? emptySoundItems;

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "sounds"] });
  };

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "sounds"] });
  };

  return (
    <>
      <SoundsSection
        items={soundItems}
        keyword={soundKeyword}
        pageInfo={soundsQuery.data?.meta}
        onKeywordChange={(keyword) => {
          setSoundKeyword(keyword);
          setSoundPage(0);
        }}
        onPageChange={setSoundPage}
        isLoading={soundsQuery.isLoading}
        isError={soundsQuery.isError}
        onAddClick={() => {
          setSelectedSound(null);
          setIsModalOpen(true);
        }}
        onEdit={(sound) => {
          setSelectedSound(sound);
          setIsModalOpen(true);
        }}
        onDelete={(sound) => {
          setDeleteSound(sound);
        }}
      />

      {isModalOpen && (
        <SoundModal
          sound={selectedSound}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSound(null);
          }}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {deleteSound && (
        <SoundDeleteModal
          soundId={deleteSound.id}
          soundTitle={deleteSound.title || ""}
          onClose={() => setDeleteSound(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
