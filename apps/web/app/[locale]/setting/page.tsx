"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  ChevronRight,
  Filter,
  KeyRound,
  Lock,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@repo/ui/button";
import {
  addContentFilterTag,
  changePassword,
  confirmAccountStatus,
  deleteContentFilterTag,
  getBlockedUsers,
  getContentFilterTags,
  getCurrentUser,
  sendAccountStatusOtp,
  unblockUser,
  updatePrivacySettings,
  type AccountStatusAction,
  type UpdatePrivacySettingsPayload,
} from "@/services/user-api-service";
import { authLogout } from "@/services/auth-api-service";
import { clearCredentials, setCredentials } from "@/store/slices/authSlice";
import type { RootState } from "@/store/store";
import { Logo } from "@/components/layout/LayoutHelpers";

type ConfirmAction = "PUBLIC_ACCOUNT" | null;
type SettingSectionId = "account" | "privacy" | "blocked" | "filters";
type AccountStatusStep = "overview" | "details" | "otp";

const commentOptions = ["EVERYONE", "NO_ONE"] as const;
const sectionOrder: SettingSectionId[] = ["account", "privacy", "blocked", "filters"];

export default function SettingPage() {
  const t = useTranslations("SettingPage");
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();
  const storeUser = useSelector((state: RootState) => state.auth.user);

  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);
  const [accountStatusAction, setAccountStatusAction] = React.useState<AccountStatusAction | null>(null);
  const [accountStatusStep, setAccountStatusStep] = React.useState<AccountStatusStep>("overview");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountOtp, setAccountOtp] = React.useState("");
  const [otpCooldown, setOtpCooldown] = React.useState(0);
  const [tagInput, setTagInput] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [activeSection, setActiveSection] = React.useState<SettingSectionId>("account");
  const scrollContainerRef = React.useRef<HTMLElement | null>(null);
  const sectionRefs = React.useRef<Record<SettingSectionId, HTMLDivElement | null>>({
    account: null,
    privacy: null,
    blocked: null,
    filters: null,
  });

  const currentUserQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  const user = currentUserQuery.data?.data ?? storeUser;
  const isPrivate = Boolean(user?.isPrivate);
  const commentPermission = user?.privacySettings?.allowComments === false ? "NO_ONE" : "EVERYONE";
  const showPosts = user?.privacySettings?.showPosts !== false;
  const showReposts = user?.privacySettings?.showReposts !== false;
  const showLikedVideos = user?.privacySettings?.showLikedVideos === true;
  const showFavorites = user?.privacySettings?.showFavorites === true;

  const blockedUsersQuery = useQuery({
    queryKey: ["settings", "blocked-users"],
    queryFn: getBlockedUsers,
    enabled: Boolean(user),
  });

  const contentFiltersQuery = useQuery({
    queryKey: ["settings", "content-filters"],
    queryFn: getContentFilterTags,
    enabled: Boolean(user),
  });

  const privacyMutation = useMutation({
    mutationFn: updatePrivacySettings,
    onSuccess: (response) => {
      if (response.data) {
        dispatch(setCredentials(response.data));
        queryClient.setQueryData(["currentUser"], response);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setFeedback(t("saved"));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordDialogOpen(false);
      setFeedback(t("passwordUpdated"));
    },
  });

  const sendAccountOtpMutation = useMutation({
    mutationFn: sendAccountStatusOtp,
    onSuccess: () => {
      setAccountStatusStep("otp");
      setOtpCooldown(30);
      setFeedback(t("otpSent"));
    },
  });

  const confirmAccountStatusMutation = useMutation({
    mutationFn: confirmAccountStatus,
    onSuccess: async () => {
      await authLogout().catch(() => undefined);
      dispatch(clearCredentials());
      queryClient.clear();
      router.replace("/");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "blocked-users"] });
      setFeedback(t("unblocked"));
    },
  });

  const addTagMutation = useMutation({
    mutationFn: addContentFilterTag,
    onSuccess: () => {
      setTagInput("");
      queryClient.invalidateQueries({ queryKey: ["settings", "content-filters"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      setFeedback(t("tagAdded"));
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteContentFilterTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "content-filters"] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-videos"] });
      setFeedback(t("tagRemoved"));
    },
  });

  const handlePrivateToggle = () => {
    if (isPrivate) {
      setConfirmAction("PUBLIC_ACCOUNT");
      return;
    }
    privacyMutation.mutate({ isPrivate: true });
  };

  const confirmPublicAccount = () => {
    privacyMutation.mutate({ isPrivate: false });
    setConfirmAction(null);
  };

  const handleCommentPermission = (value: (typeof commentOptions)[number]) => {
    privacyMutation.mutate({ allowComments: value === "EVERYONE" });
  };

  const handleProfileContentVisibility = (
    key: Extract<keyof UpdatePrivacySettingsPayload, "showPosts" | "showReposts" | "showLikedVideos" | "showFavorites">,
    value: boolean,
  ) => {
    privacyMutation.mutate({ [key]: value });
  };

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback(t("passwordMismatch"));
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const submitTag = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tag = tagInput.trim().replace(/^#/, "");
    if (!tag) return;
    addTagMutation.mutate({ tag });
  };

  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(() => setOtpCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);



  const closeAccountStatusFlow = () => {
    setAccountStatusAction(null);
    setAccountStatusStep("overview");
    setAccountOtp("");
    setOtpCooldown(0);
  };

  const sendAccountOtp = () => {
    if (!accountStatusAction) return;
    sendAccountOtpMutation.mutate({ action: accountStatusAction });
  };

  const resendAccountOtp = () => {
    if (!accountStatusAction || otpCooldown > 0) return;
    sendAccountOtpMutation.mutate({ action: accountStatusAction });
  };

  const submitAccountOtp = () => {
    if (!accountStatusAction) return;
    if (!/^\d{6}$/.test(accountOtp)) {
      setFeedback(t("otpRequired"));
      return;
    }
    confirmAccountStatusMutation.mutate({ action: accountStatusAction, otp: accountOtp });
  };

  const scrollToSection = (sectionId: SettingSectionId) => {
    const container = scrollContainerRef.current;
    const target = sectionRefs.current[sectionId];
    if (!container || !target) return;

    container.scrollTo({
      top: Math.max(target.offsetTop - 8, 0),
      behavior: "smooth",
    });
    setActiveSection(sectionId);
  };

  const handleSettingsScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentTop = container.scrollTop + 72;
    const currentSection = sectionOrder.reduce<SettingSectionId>((active, sectionId) => {
      const section = sectionRefs.current[sectionId];
      return section && section.offsetTop <= currentTop ? sectionId : active;
    }, "account");

    setActiveSection(currentSection);
  };

  if (!user && currentUserQuery.isLoading) {
    return (
      <SettingsShell user={null}>
        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
        </main>
      </SettingsShell>
    );
  }

  if (!user) {
    return (
      <SettingsShell user={null}>
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Panel>
            <h1 className="text-2xl font-bold text-text-primary">{t("loginTitle")}</h1>
            <p className="mt-2 text-sm text-text-secondary">{t("loginDescription")}</p>
          </Panel>
        </main>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell user={user}>
      <main className="mx-auto grid w-full max-w-[1376px] gap-4 overflow-visible px-4 py-4 md:h-[calc(100vh-80px)] md:grid-cols-[88px_minmax(260px,360px)_minmax(0,1fr)] md:items-start md:gap-5 md:overflow-hidden md:py-6 lg:px-8">
        <div className="hidden justify-center pt-0 md:flex">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-hover"
            aria-label={t("back")}
            title={t("back")}
          >
            <ChevronRight size={26} className="rotate-180" />
          </button>
        </div>

        <aside className="flex h-fit gap-2 overflow-x-auto rounded-lg border border-elevated bg-surface p-2 md:block md:self-start md:p-5">
          <NavItem
            icon={<UserCog size={24} />}
            active={activeSection === "account"}
            label={t("accountManagement")}
            onClick={() => scrollToSection("account")}
          />
          <NavItem
            icon={<Lock size={24} />}
            active={activeSection === "privacy"}
            label={t("privacy")}
            onClick={() => scrollToSection("privacy")}
          />
          <NavItem
            icon={<Ban size={24} />}
            active={activeSection === "blocked"}
            label={t("blockedAccounts")}
            onClick={() => scrollToSection("blocked")}
          />
          <NavItem
            icon={<Filter size={24} />}
            active={activeSection === "filters"}
            label={t("contentFilters")}
            onClick={() => scrollToSection("filters")}
          />
        </aside>

        <section
          ref={scrollContainerRef}
          onScroll={handleSettingsScroll}
          className="no-scrollbar space-y-5 overflow-visible scroll-smooth pb-10 md:h-full md:overflow-y-auto md:pr-1"
        >
          {feedback ? (
            <div className="rounded-md border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
              {feedback}
            </div>
          ) : null}

        <div ref={(node) => { sectionRefs.current.account = node; }}>
        <Panel>
          {accountStatusAction ? (
            <AccountStatusFlow
              action={accountStatusAction}
              step={accountStatusStep}
              email={user.email}
              otp={accountOtp}
              otpCooldown={otpCooldown}
              isSendingOtp={sendAccountOtpMutation.isPending}
              isConfirming={confirmAccountStatusMutation.isPending}
              t={t}
              onBack={() => {
                if (accountStatusStep === "overview" || accountStatusStep === "details") {
                  closeAccountStatusFlow();
                } else if (accountStatusStep === "otp") {
                  setAccountStatusStep("details");
                }
              }}
              onSelectAction={(action) => {
                setAccountStatusAction(action);
                setAccountStatusStep("details");
              }}
              onContinue={sendAccountOtp}
              onOtpChange={setAccountOtp}
              onResendOtp={resendAccountOtp}
              onConfirm={submitAccountOtp}
            />
          ) : (
            <>
              <SectionHeader title={t("accountManagement")} subtitle={t("accountDescription")} icon={<UserCog />} />
              <div className="mt-6 divide-y divide-elevated border-t border-elevated">
                <ActionRow
                  title={t("updatePassword")}
                  description={t("updatePasswordDescription")}
                  actionLabel={t("continue")}
                  onClick={() => setIsPasswordDialogOpen(true)}
                />
                <ActionRow
                  title={t("deactivateOrDeleteTitle")}
                  description={t("deactivateOrDeleteDescription")}
                  actionLabel={t("continue")}
                  onClick={() => {
                    setAccountStatusAction("DEACTIVATE");
                    setAccountStatusStep("overview");
                  }}
                />
              </div>
            </>
          )}
        </Panel>
        </div>

        <div ref={(node) => { sectionRefs.current.privacy = node; }}>
        <Panel>
          <SectionHeader title={t("privacy")} subtitle={t("privacyDescription")} icon={<Shield />} />
          <SettingRow
            title={t("privateAccount")}
            description={t("privateAccountDescription")}
            control={<Toggle checked={isPrivate} disabled={privacyMutation.isPending} onClick={handlePrivateToggle} />}
          />
          <SettingRow
            title={t("showPosts")}
            description={t("showPostsDescription")}
            control={
              <Toggle
                checked={showPosts}
                disabled={privacyMutation.isPending}
                onClick={() => handleProfileContentVisibility("showPosts", !showPosts)}
              />
            }
          />
          <SettingRow
            title={t("showReposts")}
            description={t("showRepostsDescription")}
            control={
              <Toggle
                checked={showReposts}
                disabled={privacyMutation.isPending}
                onClick={() => handleProfileContentVisibility("showReposts", !showReposts)}
              />
            }
          />
          <SettingRow
            title={t("showLikedVideos")}
            description={t("showLikedVideosDescription")}
            control={
              <Toggle
                checked={showLikedVideos}
                disabled={privacyMutation.isPending}
                onClick={() => handleProfileContentVisibility("showLikedVideos", !showLikedVideos)}
              />
            }
          />
          <SettingRow
            title={t("showFavorites")}
            description={t("showFavoritesDescription")}
            control={
              <Toggle
                checked={showFavorites}
                disabled={privacyMutation.isPending}
                onClick={() => handleProfileContentVisibility("showFavorites", !showFavorites)}
              />
            }
          />
          <SettingRow
            title={t("comments")}
            description={t("commentsDescription")}
            control={
              <select
                value={commentPermission}
                onChange={(event) => handleCommentPermission(event.target.value as (typeof commentOptions)[number])}
                className="min-w-36 rounded-md border border-elevated bg-background px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-brand"
              >
                {commentOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`commentOptions.${option}`)}
                  </option>
                ))}
              </select>
            }
          />
        </Panel>
        </div>

        <div ref={(node) => { sectionRefs.current.blocked = node; }}>
        <Panel>
          <SectionHeader title={t("blockedAccounts")} subtitle={t("blockedDescription")} icon={<Ban />} />
          <div className="mt-4 space-y-3">
            {blockedUsersQuery.isLoading ? <LoadingRows /> : null}
            {blockedUsersQuery.data?.data?.length ? (
              blockedUsersQuery.data.data.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center justify-between gap-3 rounded-md border border-elevated bg-background px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="h-10 w-10 overflow-hidden rounded-full bg-elevated bg-cover bg-center"
                      style={blockedUser.avatarUrl ? { backgroundImage: `url(${blockedUser.avatarUrl})` } : undefined}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text-primary">@{blockedUser.username}</p>
                      <p className="truncate text-xs text-text-secondary">{blockedUser.nickname || blockedUser.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={unblockMutation.isPending}
                    onClick={() => unblockMutation.mutate(blockedUser.username)}
                  >
                    {t("unblock")}
                  </Button>
                </div>
              ))
            ) : !blockedUsersQuery.isLoading ? (
              <EmptyState text={t("noBlockedAccounts")} />
            ) : null}
          </div>
        </Panel>
        </div>

        <div ref={(node) => { sectionRefs.current.filters = node; }}>
        <Panel>
          <SectionHeader title={t("contentFilters")} subtitle={t("contentFiltersDescription")} icon={<Filter />} />
          <form onSubmit={submitTag} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder={t("tagPlaceholder")}
              className="min-h-11 flex-1 rounded-md border border-elevated bg-background px-3 text-sm text-text-primary outline-none focus:border-brand"
            />
            <Button type="submit" disabled={addTagMutation.isPending}>{t("addTag")}</Button>
          </form>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {contentFiltersQuery.isLoading ? <LoadingRows /> : null}
            {contentFiltersQuery.data?.data?.length ? (
              contentFiltersQuery.data.data.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3 rounded-md border border-elevated bg-background p-3">
                  <div
                    className="h-14 w-10 overflow-hidden rounded bg-elevated bg-cover bg-center"
                    style={tag.sampleThumbnailUrl ? { backgroundImage: `url(${tag.sampleThumbnailUrl})` } : undefined}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary">#{tag.tag}</p>
                    <p className="text-xs text-text-secondary">{t("hiddenTagHint")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTagMutation.mutate(tag.tag)}
                    className="rounded-md p-2 text-text-secondary transition-colors hover:bg-hover hover:text-brand"
                    aria-label={t("removeTag")}
                    title={t("removeTag")}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))
            ) : !contentFiltersQuery.isLoading ? (
              <div className="sm:col-span-2">
                <EmptyState text={t("noFilteredTags")} />
              </div>
            ) : null}
          </div>
        </Panel>
        </div>
        </section>

        {confirmAction === "PUBLIC_ACCOUNT" ? (
        <ConfirmDialog
          title={t("publicConfirmTitle")}
          description={t("publicConfirmDescription")}
          cancelLabel={t("cancel")}
          confirmLabel={t("confirm")}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmPublicAccount}
        />
        ) : null}

        {isPasswordDialogOpen ? (
          <PasswordDialog
            form={passwordForm}
            isPending={passwordMutation.isPending}
            labels={{
              title: t("updatePassword"),
              description: t("updatePasswordDialogDescription"),
              currentPassword: t("currentPassword"),
              newPassword: t("newPassword"),
              confirmPassword: t("confirmPassword"),
              cancel: t("cancel"),
              submit: t("updatePassword"),
            }}
            onCancel={() => {
              setIsPasswordDialogOpen(false);
              setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }}
            onChange={setPasswordForm}
            onSubmit={submitPassword}
          />
        ) : null}
      </main>
    </SettingsShell>
  );
}

function SettingsShell({ children, user }: { children: React.ReactNode; user: { username?: string; avatarUrl?: string } | null }) {
  const t = useTranslations("SettingPage");

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 border-b border-elevated bg-background/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:h-20 md:gap-4 md:px-5">
          <div className="flex min-w-0 items-center gap-2 md:min-w-[160px]">
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:flex" />
            <span className="text-2xl font-black tracking-normal text-text-primary md:text-3xl">TopTop</span>
          </div>
          <label className="hidden h-14 w-full max-w-[626px] items-center rounded-full border border-elevated bg-surface px-5 text-text-secondary focus-within:border-text-muted md:flex">
            <input
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-text-primary outline-none placeholder:text-text-muted"
              placeholder={t("search")}
            />
            <Search size={26} />
          </label>
          <div className="flex min-w-0 items-center justify-end gap-2 md:min-w-[160px] md:gap-3">
            <Button type="button" variant="secondary" className="hidden rounded-md sm:inline-flex" size="sm">
              <Plus size={18} />
              {t("upload")}
            </Button>
            <div
              className="h-11 w-11 rounded-full border border-elevated bg-elevated bg-cover bg-center"
              style={user?.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}
              aria-label={user?.username}
              title={user?.username}
            />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-elevated bg-surface p-5 shadow-sm">{children}</div>;
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-3 text-left text-sm font-bold transition-colors hover:bg-hover md:w-full md:gap-4 md:py-4 md:text-lg ${
        active ? "text-brand" : "text-text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-brand">{icon}</div>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-elevated pt-5">
      <div>
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p>
      </div>
      {control}
    </div>
  );
}

function ActionRow({
  title,
  description,
  actionLabel,
  onClick,
  danger = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 py-4 text-left">
      <span>
        <span className={`block text-sm font-bold ${danger ? "text-brand" : "text-text-primary"}`}>{title}</span>
        <span className="mt-1 block text-xs text-text-secondary">{description}</span>
      </span>
      <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
        {actionLabel}
        <ChevronRight size={18} />
      </span>
    </button>
  );
}

function AccountStatusFlow({
  action,
  step,
  email,
  otp,
  otpCooldown,
  isSendingOtp,
  isConfirming,
  t,
  onBack,
  onSelectAction,
  onContinue,
  onOtpChange,
  onResendOtp,
  onConfirm,
}: {
  action: AccountStatusAction;
  step: AccountStatusStep;
  email?: string;
  otp: string;
  otpCooldown: number;
  isSendingOtp: boolean;
  isConfirming: boolean;
  t: ReturnType<typeof useTranslations>;
  onBack: () => void;
  onSelectAction: (action: AccountStatusAction) => void;
  onContinue: () => void;
  onOtpChange: (value: string) => void;
  onResendOtp: () => void;
  onConfirm: () => void;
}) {
  if (step === "overview") {
    return (
      <div className="min-h-[560px]">
        <BackButton onClick={onBack} label={t("back")} />
        <div className="mt-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-text-primary">{t("deactivateOrDeleteTitle")}</h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-text-primary">
            {t("deactivateOrDeleteIntro")}
          </p>
          <div className="mt-8 space-y-4">
            <AccountChoiceCard
              title={t("deactivateAccount")}
              description={t("deactivateOptionDescription")}
              onClick={() => onSelectAction("DEACTIVATE")}
            />
            <AccountChoiceCard
              title={t("deletePermanentTitle")}
              description={t("deleteOptionDescription")}
              onClick={() => onSelectAction("DELETE")}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === "details") {
    const isDelete = action === "DELETE";
    return (
      <div className="flex min-h-[640px] flex-col">
        <BackButton onClick={onBack} label={t("back")} />
        <div className="mt-8 max-w-3xl">
          <h1 className="text-2xl font-bold text-text-primary">
            {isDelete ? t("deleteDetailsTitle") : t("deactivateDetailsTitle")}
          </h1>
          <p className="mt-5 text-base font-semibold leading-7 text-text-primary">
            {isDelete ? t("deleteDetailsIntro") : t("deactivateDetailsIntro")}
          </p>
          <p className="mt-6 text-base font-semibold text-text-primary">
            {isDelete ? t("ifDeleteAccount") : t("ifDeactivateAccount")}
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-6 text-base font-semibold leading-7 text-text-primary">
            {(isDelete ? [
              t("deleteBulletLogin"),
              t("deleteBulletVideos"),
              t("deleteBulletMessages"),
              t("deleteBulletDrafts"),
              t("deleteBulletRefund"),
            ] : [
              t("deactivateBulletHidden"),
              t("deactivateBulletRestore"),
              t("deactivateBulletLogin"),
            ]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-6 text-base font-semibold text-text-primary">{t("continueQuestion")}</p>
        </div>
        <div className="mt-auto pt-8">
          <Button type="button" size="xl" className="w-full rounded-md" disabled={isSendingOtp} onClick={onContinue}>
            {isSendingOtp ? t("sendingOtp") : t("continue")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[520px]">
      <BackButton onClick={onBack} label={t("back")} />
      <div className="mx-auto mt-10 max-w-md">
        <h1 className="text-center text-2xl font-bold text-text-primary">{t("otpTitle")}</h1>
        <p className="mt-4 text-center text-sm leading-6 text-text-secondary">
          {t("otpDescription")} {email}
        </p>
        <input
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="mt-6 w-full rounded-md border border-elevated bg-background px-3 py-4 text-center text-2xl font-bold tracking-[0.5em] text-text-primary outline-none focus:border-brand"
        />
        <button
          type="button"
          disabled={otpCooldown > 0 || isSendingOtp}
          onClick={onResendOtp}
          className="mt-4 w-full text-center text-sm font-bold text-brand disabled:text-text-muted"
        >
          {otpCooldown > 0 ? t("resendOtpIn").replace("{seconds}", String(otpCooldown)) : t("resendOtp")}
        </button>
        <Button type="button" size="xl" className="mt-5 w-full rounded-md" disabled={isConfirming} onClick={onConfirm}>
          {isConfirming ? t("confirming") : (action === "DELETE" ? t("deleteAccount") : t("deactivateAccount"))}
        </Button>
      </div>
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-hover"
      aria-label={label}
      title={label}
    >
      <ChevronRight size={26} className="rotate-180" />
    </button>
  );
}

function AccountChoiceCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-lg bg-elevated px-5 py-5 text-left transition-colors hover:bg-hover"
    >
      <span>
        <span className="block text-lg font-bold text-text-primary">{title}</span>
        <span className="mt-2 block max-w-2xl text-sm font-semibold leading-6 text-text-primary">{description}</span>
      </span>
      <ChevronRight size={24} className="shrink-0 text-text-primary" />
    </button>
  );
}

function Toggle({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-elevated"} disabled:opacity-60`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${checked ? "left-7" : "left-1"}`} />
    </button>
  );
}

function ConfirmDialog({
  children,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  danger = false,
}: {
  children?: React.ReactNode;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
      <div className="modal-opacity-solid w-full max-w-md rounded-lg border border-elevated bg-background p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-bold text-text-primary">{title}</h2>
        <p className="mt-4 text-center text-base leading-7 text-text-secondary">{description}</p>
        {children}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button type="button" variant={danger ? "primary" : "secondary"} onClick={onConfirm}>
            <Trash2 size={16} />
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PasswordDialog({
  form,
  labels,
  isPending,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: { currentPassword: string; newPassword: string; confirmPassword: string };
  labels: {
    title: string;
    description: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    cancel: string;
    submit: string;
  };
  isPending: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<{ currentPassword: string; newPassword: string; confirmPassword: string }>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
      <form onSubmit={onSubmit} className="modal-opacity-solid w-full max-w-md rounded-lg border border-elevated bg-background p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-bold text-text-primary">{labels.title}</h2>
        <p className="mt-3 text-center text-sm leading-6 text-text-secondary">{labels.description}</p>
        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={form.currentPassword}
            onChange={(event) => onChange((prev) => ({ ...prev, currentPassword: event.target.value }))}
            placeholder={labels.currentPassword}
            className="w-full rounded-md border border-elevated bg-background px-3 py-3 text-sm text-text-primary outline-none focus:border-brand"
            autoComplete="current-password"
          />
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => onChange((prev) => ({ ...prev, newPassword: event.target.value }))}
            placeholder={labels.newPassword}
            className="w-full rounded-md border border-elevated bg-background px-3 py-3 text-sm text-text-primary outline-none focus:border-brand"
            autoComplete="new-password"
          />
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => onChange((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            placeholder={labels.confirmPassword}
            className="w-full rounded-md border border-elevated bg-background px-3 py-3 text-sm text-text-primary outline-none focus:border-brand"
            autoComplete="new-password"
          />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>{labels.cancel}</Button>
          <Button type="submit" disabled={isPending}>
            <KeyRound size={16} />
            {labels.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-elevated px-4 py-6 text-center text-sm text-text-secondary">{text}</div>;
}

function LoadingRows() {
  return (
    <>
      <div className="h-16 animate-pulse rounded-md bg-elevated/70" />
      <div className="h-16 animate-pulse rounded-md bg-elevated/70" />
    </>
  );
}
