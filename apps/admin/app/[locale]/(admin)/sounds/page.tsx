"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SoundsSection } from "@/components/dashboard/SoundsSection";
import { getAdminSounds } from "@/services/sound-api-service";
import type { SoundItem } from "@/types/admin";

const emptySoundItems: SoundItem[] = [];

export default function AdminSoundsPage() {
  const [soundKeyword, setSoundKeyword] = useState("");
  const [soundPage, setSoundPage] = useState(0);

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

  return (
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
    />
  );
}
