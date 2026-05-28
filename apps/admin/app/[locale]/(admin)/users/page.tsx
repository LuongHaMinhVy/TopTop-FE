"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UsersSection } from "@/components/dashboard/UsersSection";
import { getAdminUsers } from "@/services/user-admin-api-service";
import type { AdminUser } from "@/types/admin";

const emptyUserItems: AdminUser[] = [];

export default function AdminUsersPage() {
  const [userKeyword, setUserKeyword] = useState("");
  const [userStatus, setUserStatus] = useState<AdminUser["status"] | "">("");
  const [userPage, setUserPage] = useState(0);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", userKeyword, userStatus, userPage],
    queryFn: () =>
      getAdminUsers({
        keyword: userKeyword.trim() || undefined,
        status: userStatus,
        page: userPage,
        size: 20,
      }),
  });

  const userItems = usersQuery.data?.data?.content ?? emptyUserItems;

  return (
    <UsersSection
      items={userItems}
      keyword={userKeyword}
      status={userStatus}
      pageInfo={usersQuery.data?.data}
      onKeywordChange={(keyword) => {
        setUserKeyword(keyword);
        setUserPage(0);
      }}
      onStatusChange={(status) => {
        setUserStatus(status);
        setUserPage(0);
      }}
      onPageChange={setUserPage}
      isLoading={usersQuery.isLoading}
      isError={usersQuery.isError}
    />
  );
}
