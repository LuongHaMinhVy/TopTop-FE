"use client";

import type { ReactNode } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";

export default function AdminPagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
