"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function LegacyDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/overview");
  }, [router]);

  return null;
}
