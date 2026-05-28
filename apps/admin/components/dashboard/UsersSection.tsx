"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Eye,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Input, Select } from "@/components/ui";
import { updateAdminUserStatus } from "@/services/user-admin-api-service";
import type {
  AdminUpdateUserStatusRequest,
  AdminUser,
  PageResponse,
} from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "./dashboard-common";
import { formatDate, statusVariant } from "./dashboard-utils";

type UserStatusFilter = AdminUser["status"] | "";
type PendingAction = {
  user: AdminUser;
  status: AdminUpdateUserStatusRequest["status"];
} | null;

const statusOptions: UserStatusFilter[] = ["", "ACTIVE", "SUSPENDED", "BANNED"];

export function UsersSection({
  items,
  keyword,
  status,
  pageInfo,
  onKeywordChange,
  onStatusChange,
  onPageChange,
  isLoading,
  isError,
}: {
  items: AdminUser[];
  keyword: string;
  status: UserStatusFilter;
  pageInfo?: PageResponse<AdminUser>;
  onKeywordChange: (keyword: string) => void;
  onStatusChange: (status: UserStatusFilter) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState("");
  const statusSelectOptions = statusOptions.map((option) => ({
    value: option,
    label: option ? t(`users.status.${option}`) : t("users.allStatuses"),
  }));

  const summary = useMemo(() => {
    return items.reduce(
      (acc, user) => {
        acc[user.status] += 1;
        if (user.deletedAt) acc.deleted += 1;
        return acc;
      },
      { ACTIVE: 0, SUSPENDED: 0, BANNED: 0, deleted: 0 },
    );
  }, [items]);

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      request,
    }: {
      userId: number;
      request: AdminUpdateUserStatusRequest;
    }) => updateAdminUserStatus(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
      setPendingAction(null);
      setReason("");
    },
  });

  const confirmAction = () => {
    if (!pendingAction) return;
    statusMutation.mutate({
      userId: pendingAction.user.id,
      request: {
        status: pendingAction.status,
        reason: reason.trim() || undefined,
      },
    });
  };

  return (
    <Panel
      title={t("users.title")}
      description={t("users.description")}
      action={
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[560px] md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("users.searchPlaceholder")}
              className="h-10 rounded-lg py-2 pl-10 pr-4"
            />
          </div>
          <Select
            value={status}
            options={statusSelectOptions}
            onChange={(nextStatus) => onStatusChange(nextStatus as UserStatusFilter)}
            ariaLabel={t("users.allStatuses")}
            className="md:w-52"
          />
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <UserMetric icon={UserCheck} label={t("users.activeCount")} value={summary.ACTIVE} />
        <UserMetric icon={Lock} label={t("users.suspendedCount")} value={summary.SUSPENDED} />
        <UserMetric icon={Ban} label={t("users.bannedCount")} value={summary.BANNED} />
        <UserMetric icon={CalendarClock} label={t("users.pendingDeleteCount")} value={summary.deleted} />
      </div>

      {isError ? (
        <EmptyState
          icon={UserX}
          title={t("users.loadErrorTitle")}
          detail={t("users.loadErrorDesc")}
        />
      ) : isLoading ? (
        <LoadingRows count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("users.emptyTitle")}
          detail={t("users.emptyDesc")}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-elevated">
            <div className="grid grid-cols-[minmax(280px,1.4fr)_130px_150px_130px_160px] gap-4 border-b border-elevated bg-surface px-4 py-3 text-xs font-black uppercase text-text-muted">
              <span>{t("users.tableUser")}</span>
              <span>{t("users.tableStatus")}</span>
              <span>{t("users.tableReach")}</span>
              <span>{t("users.tableCreated")}</span>
              <span className="text-right">{t("users.tableActions")}</span>
            </div>
            {items.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[minmax(280px,1.4fr)_130px_150px_130px_160px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0"
              >
                <UserIdentity user={user} />
                <div className="space-y-1">
                  <Badge variant={statusVariant(user.status)} size="sm">
                    {t(`users.status.${user.status}`)}
                  </Badge>
                  {user.deletedAt ? (
                    <p className="text-[11px] font-bold text-brand">{t("users.hiddenAccount")}</p>
                  ) : null}
                  {user.statusReason ? (
                    <p className="line-clamp-2 text-[11px] font-semibold text-text-muted">
                      {user.statusReason}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm font-bold text-text-primary">
                  <p>{t("users.followersCount", { count: user.followersCount })}</p>
                  <p className="text-xs text-text-muted">{t("users.likesCount", { count: user.totalLikes })}</p>
                </div>
                <p className="text-xs font-semibold text-text-muted">{formatDate(user.createdAt)}</p>
                <div className="flex justify-end gap-2">
                  <IconActionButton
                    label={t("users.view")}
                    icon={Eye}
                    variant="ghost"
                    onClick={() => setSelectedUser(user)}
                  />
                  {user.status === "ACTIVE" ? (
                    <IconActionButton
                      label={t("users.ban")}
                      icon={Ban}
                      variant="danger"
                      onClick={() => setPendingAction({ user, status: "BANNED" })}
                    />
                  ) : (
                    <IconActionButton
                      label={t("users.activate")}
                      icon={RotateCcw}
                      variant="secondary"
                      onClick={() => setPendingAction({ user, status: "ACTIVE" })}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
            <span>
              {t("users.pageSummary", {
                page: (pageInfo?.number ?? 0) + 1,
                total: Math.max(pageInfo?.totalPages ?? 1, 1),
                count: pageInfo?.totalElements ?? items.length,
              })}
            </span>
            <div className="flex gap-2">
              <IconActionButton
                label={t("users.previous")}
                icon={ChevronLeft}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number <= 0}
                onClick={() => onPageChange(Math.max((pageInfo?.number ?? 0) - 1, 0))}
              />
              <IconActionButton
                label={t("users.next")}
                icon={ChevronRight}
                variant="secondary"
                disabled={!pageInfo || pageInfo.number + 1 >= pageInfo.totalPages}
                onClick={() => onPageChange((pageInfo?.number ?? 0) + 1)}
              />
            </div>
          </div>
        </>
      )}

      {selectedUser ? (
        <UserDetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={(targetStatus) => {
            setPendingAction({ user: selectedUser, status: targetStatus });
            setSelectedUser(null);
          }}
        />
      ) : null}

      {pendingAction ? (
        <UserActionDialog
          action={pendingAction}
          reason={reason}
          isPending={statusMutation.isPending}
          onReasonChange={setReason}
          onCancel={() => {
            setPendingAction(null);
            setReason("");
          }}
          onConfirm={confirmAction}
        />
      ) : null}
    </Panel>
  );
}

function UserMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-elevated bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-text-muted">{label}</p>
        <Icon className="h-4 w-4 text-text-muted" />
      </div>
      <p className="mt-2 text-2xl font-black text-text-primary">{value}</p>
    </div>
  );
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-text-muted" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black">@{user.username}</p>
          {user.verified ? (
            <Badge variant="brand" size="sm">
              ✓
            </Badge>
          ) : null}
          {user.isPrivate ? (
            <Badge variant="info" size="sm">
              private
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-text-muted">{user.nickname}</p>
        <p className="truncate text-xs text-text-muted">{user.email}</p>
      </div>
    </div>
  );
}

function UserDetailDrawer({
  user,
  onClose,
  onAction,
}: {
  user: AdminUser;
  onClose: () => void;
  onAction: (status: AdminUpdateUserStatusRequest["status"]) => void;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
      <button type="button" className="flex-1" aria-label={t("users.closeDetail")} onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-elevated bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <UserIdentity user={user} />
          <IconActionButton label={t("users.close")} icon={CircleX} variant="ghost" onClick={onClose} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <DetailItem label={t("users.statusLabel")} value={t(`users.status.${user.status}`)} />
          {user.statusReason ? (
            <DetailItem label={t("users.statusReasonLabel")} value={user.statusReason} />
          ) : null}
          <DetailItem label={t("users.visibilityLabel")} value={user.isPrivate ? t("users.private") : t("users.public")} />
          <DetailItem label={t("users.followingLabel")} value={String(user.followingCount)} />
          <DetailItem label={t("users.followersLabel")} value={String(user.followersCount)} />
          <DetailItem label={t("users.likesLabel")} value={String(user.totalLikes)} />
          <DetailItem label={t("users.createdLabel")} value={formatDate(user.createdAt)} />
        </div>

        {user.deletedAt ? (
          <div className="mt-5 rounded-lg border border-brand/30 bg-brand/10 p-4 text-sm leading-6 text-text-primary">
            <p className="font-black">{t("users.deletionStateTitle")}</p>
            <p>{t("users.deletedAt", { value: formatDate(user.deletedAt) })}</p>
            {user.deletionScheduledAt ? (
              <p>{t("users.deletionScheduledAt", { value: formatDate(user.deletionScheduledAt) })}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {user.status !== "ACTIVE" ? (
            <IconActionButton
              label={t("users.activate")}
              icon={RotateCcw}
              variant="secondary"
              className="h-11 w-full rounded-lg"
              onClick={() => onAction("ACTIVE")}
            />
          ) : null}
          {user.status === "ACTIVE" ? (
            <div className="grid grid-cols-2 gap-3">
              <IconActionButton
                label={t("users.suspend")}
                icon={Lock}
                variant="outline"
                className="h-11 w-full rounded-lg"
                onClick={() => onAction("SUSPENDED")}
              />
              <IconActionButton
                label={t("users.ban")}
                icon={Ban}
                variant="danger"
                className="h-11 w-full rounded-lg"
                onClick={() => onAction("BANNED")}
              />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-elevated bg-surface p-3">
      <p className="text-[11px] font-black uppercase text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function UserActionDialog({
  action,
  reason,
  isPending,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  action: NonNullable<PendingAction>;
  reason: string;
  isPending: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Admin.dashboard");
  const isRestore = action.status === "ACTIVE";
  const isBan = action.status === "BANNED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-elevated bg-background p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${isRestore ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {isRestore ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary">
              {t(isRestore ? "users.confirmActivateTitle" : isBan ? "users.confirmBanTitle" : "users.confirmSuspendTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {t("users.confirmActionDesc", { username: action.user.username })}
            </p>
          </div>
        </div>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder={t(isRestore ? "users.restoreReasonPlaceholder" : "users.reasonPlaceholder")}
          maxLength={500}
          className="mt-5 min-h-28 w-full rounded-lg border border-elevated bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-brand"
        />
        {!isRestore ? (
          <p className="mt-2 text-xs font-semibold text-text-muted">
            {t("users.reasonRequired")}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <IconActionButton
            label={t("users.cancel")}
            icon={CircleX}
            variant="secondary"
            onClick={onCancel}
          />
          <IconActionButton
            label={t(isRestore ? "users.activate" : isBan ? "users.ban" : "users.suspend")}
            icon={isRestore ? RotateCcw : isBan ? Ban : Lock}
            variant={isRestore ? "primary" : "danger"}
            isLoading={isPending}
            disabled={!isRestore && !reason.trim()}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
