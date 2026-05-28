import { get } from "@/services/base-api-service";
import type { AdminDashboardStats } from "@/types/admin";

export const getAdminDashboardStats = async () => {
  return get<AdminDashboardStats>("/admin/dashboard/stats");
};
