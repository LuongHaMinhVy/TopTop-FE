"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LivestreamsSection } from "@/components/dashboard/LivestreamsSection";
import { getAdminLivestreams } from "@/services/livestream-admin-api-service";
import type { AdminLivestream, AdminLivestreamStatus } from "@/types/admin";

const emptyLivestreamItems: AdminLivestream[] = [];

export default function AdminLivestreamsPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<AdminLivestreamStatus | "">("");
  const [page, setPage] = useState(0);

  const livestreamsQuery = useQuery({
    queryKey: ["admin", "livestreams", keyword, status, page],
    queryFn: () =>
      getAdminLivestreams({
        keyword: keyword.trim() || undefined,
        status,
        page,
        size: 20,
      }),
  });

  const livestreamItems =
    livestreamsQuery.data?.data?.content ?? emptyLivestreamItems;

  return (
    <LivestreamsSection
      items={livestreamItems}
      keyword={keyword}
      status={status}
      pageInfo={livestreamsQuery.data?.data}
      onKeywordChange={(nextKeyword) => {
        setKeyword(nextKeyword);
        setPage(0);
      }}
      onStatusChange={(nextStatus) => {
        setStatus(nextStatus);
        setPage(0);
      }}
      onPageChange={setPage}
      isLoading={livestreamsQuery.isLoading}
      isError={livestreamsQuery.isError}
    />
  );
}
