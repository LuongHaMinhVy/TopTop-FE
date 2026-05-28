import { get, patch } from "@/services/base-api-service";
import type {
  AdminReport,
  ReviewReportRequest,
  PageResponse,
} from "@/types/admin";

export const getAdminReports = async (params?: {
  status?: string;
  page?: number;
  size?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<PageResponse<AdminReport>>(`/admin/reports?${sp.toString()}`);
};

export const reviewAdminReport = async (
  reportId: number,
  request: ReviewReportRequest,
) => {
  return patch<AdminReport>(`/admin/reports/${reportId}/review`, request);
};
