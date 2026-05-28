"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReportsSection } from "@/components/dashboard/ReportsSection";
import { getAdminReports } from "@/services/report-admin-api-service";
import type { AdminReport } from "@/types/admin";

const emptyReportItems: AdminReport[] = [];

export default function AdminReportsPage() {
  const [reportStatus, setReportStatus] = useState("");

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports", reportStatus],
    queryFn: () =>
      getAdminReports({
        status: reportStatus || undefined,
        page: 0,
        size: 20,
      }),
  });

  const reportItems = reportsQuery.data?.data?.content ?? emptyReportItems;

  return (
    <ReportsSection
      items={reportItems}
      status={reportStatus}
      onStatusChange={setReportStatus}
      isLoading={reportsQuery.isLoading}
      isError={reportsQuery.isError}
    />
  );
}
