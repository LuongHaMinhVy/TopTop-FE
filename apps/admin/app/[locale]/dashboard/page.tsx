"use client";

import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  BookOpenText,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Music2,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, Badge, Button, Input } from "@/components/ui";
import { authLogout } from "@/services/auth-api-service";
import { getVideoModerationQueue } from "@/services/moderation-api-service";
import { getAdminSounds } from "@/services/sound-api-service";
import type { ModerationQueueItem, SoundItem } from "@/types/admin";

type SectionKey = "overview" | "moderation" | "sounds" | "docs";

const featureDocs = [
  {
    name: "Upload, R2 va video editor",
    files: 4,
    status: "Core flow",
    detail:
      "Upload truc tiep len R2, xu ly metadata, preview, trim/mix/caption va editor CapCut Lite.",
  },
  {
    name: "Discovery va social graph",
    files: 5,
    status: "Feed/Search",
    detail:
      "Following feed, search, friends, profile, like/comment/share va collection/favorite.",
  },
  {
    name: "Trust & Safety",
    files: 4,
    status: "Admin critical",
    detail:
      "Report, video moderation, text moderation, copyright check, audit log va review queue.",
  },
  {
    name: "Messaging va notifications",
    files: 2,
    status: "Realtime",
    detail:
      "Realtime chat, message requests, share video qua chat va notification unread state.",
  },
  {
    name: "Platform base",
    files: 7,
    status: "Foundation",
    detail:
      "SRS, implementation notes, README, AGENTS/CLAUDE rules, eslint va app conventions.",
  },
];

const statusOptions = [
  "PENDING",
  "NEED_REVIEW",
  "APPROVED",
  "REJECTED",
  "FAILED",
];

const emptyModerationItems: ModerationQueueItem[] = [];
const emptySoundItems: SoundItem[] = [];

export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations("Admin.dashboard");
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [moderationStatus, setModerationStatus] = useState("NEED_REVIEW");
  const [soundKeyword, setSoundKeyword] = useState("");

  const moderationQuery = useQuery({
    queryKey: ["admin", "moderation", moderationStatus],
    queryFn: () =>
      getVideoModerationQueue({
        status: moderationStatus,
        page: 0,
        size: 8,
      }),
  });

  const soundsQuery = useQuery({
    queryKey: ["admin", "sounds", soundKeyword],
    queryFn: () =>
      getAdminSounds({
        keyword: soundKeyword.trim() || undefined,
        page: 0,
        size: 6,
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: authLogout,
    onSuccess: () => router.push("/login"),
  });

  const moderationItems =
    moderationQuery.data?.data?.content ?? emptyModerationItems;
  const soundItems = soundsQuery.data?.data ?? emptySoundItems;
  const moderationTotal =
    moderationQuery.data?.data?.totalElements ?? moderationItems.length;

  const stats = useMemo(
    () => [
      {
        label: t("stats.totalCreators"),
        value: "Live",
        hint: "Auth, profile, follow graph",
        icon: Users,
        tone: "bg-cyan/15 text-cyan",
      },
      {
        label: t("stats.totalVideos"),
        value: String(moderationTotal),
        hint: "Trong queue moderation hien tai",
        icon: Video,
        tone: "bg-brand/10 text-brand",
      },
      {
        label: t("stats.activityReports"),
        value: String(
          moderationItems.reduce(
            (sum, item) => sum + Number(item.reportCount ?? 0),
            0,
          ),
        ),
        hint: "Report gan voi video can duyet",
        icon: ShieldAlert,
        tone: "bg-amber-100 text-amber-700",
      },
      {
        label: "Tai lieu da tong hop",
        value: "20",
        hint: "Root, web, admin, back va packages",
        icon: BookOpenText,
        tone: "bg-blue-100 text-blue-700",
      },
    ],
    [moderationItems, moderationTotal, t],
  );

  return (
    <div className="flex min-h-screen bg-[#f7f8fa] text-text-primary">
      <aside className="hidden w-[260px] shrink-0 border-r border-elevated bg-background px-4 py-5 lg:block">
        <div className="mb-7 flex items-center gap-3 px-2">
          <TopTopMark />
          <div>
            <p className="text-lg font-black leading-tight">TopTop Admin</p>
            <p className="text-xs font-semibold uppercase text-text-muted">
              {t("ops.trustOperations")}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label={t("nav.overview")}
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
          />
          <SidebarItem
            icon={ShieldAlert}
            label={t("ops.moderation")}
            active={activeSection === "moderation"}
            onClick={() => setActiveSection("moderation")}
          />
          <SidebarItem
            icon={Music2}
            label={t("ops.sounds")}
            active={activeSection === "sounds"}
            onClick={() => setActiveSection("sounds")}
          />
          <SidebarItem
            icon={BookOpenText}
            label={t("ops.docs")}
            active={activeSection === "docs"}
            onClick={() => setActiveSection("docs")}
          />
        </nav>

        <div className="mt-8 rounded-lg border border-elevated bg-surface p-4">
          <p className="text-sm font-bold">{t("ops.sharedBase")}</p>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {t("ops.sharedBaseDesc")}
          </p>
        </div>

        <button
          onClick={() => logoutMutation.mutate()}
          className="mt-6 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-text-muted transition hover:bg-hover hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-elevated bg-background/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <TopTopMark />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black md:text-2xl">
                {t("title")}
              </h1>
              <p className="hidden text-sm text-text-muted md:block">
                {t("ops.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-hover">
              <Search className="h-5 w-5" />
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-hover">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand" />
            </button>
            <div className="hidden items-center gap-3 border-l border-elevated pl-4 md:flex">
              <Avatar alt="Admin" size="md" />
              <div>
                <p className="text-sm font-bold">{t("header.adminTeam")}</p>
                <p className="text-xs text-text-muted">{t("header.adminRole")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-8">
          <MobileNav activeSection={activeSection} onChange={setActiveSection} />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatTile key={stat.label} {...stat} />
            ))}
          </section>

          {activeSection === "overview" && (
            <OverviewSection
              moderationItems={moderationItems}
              soundItems={soundItems}
              isModerationLoading={moderationQuery.isLoading}
              isSoundLoading={soundsQuery.isLoading}
            />
          )}

          {activeSection === "moderation" && (
            <ModerationSection
              items={moderationItems}
              status={moderationStatus}
              onStatusChange={setModerationStatus}
              isLoading={moderationQuery.isLoading}
              isError={moderationQuery.isError}
            />
          )}

          {activeSection === "sounds" && (
            <SoundsSection
              items={soundItems}
              keyword={soundKeyword}
              onKeywordChange={setSoundKeyword}
              isLoading={soundsQuery.isLoading}
              isError={soundsQuery.isError}
            />
          )}

          {activeSection === "docs" && <DocsSection />}
        </div>
      </main>
    </div>
  );
}

function OverviewSection({
  moderationItems,
  soundItems,
  isModerationLoading,
  isSoundLoading,
}: {
  moderationItems: ModerationQueueItem[];
  soundItems: SoundItem[];
  isModerationLoading: boolean;
  isSoundLoading: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Panel
        title={t("ops.moderationQueueTitle")}
        description={t("ops.moderationQueueDesc")}
        action={<Badge variant="warning">Live API</Badge>}
      >
        <ModerationList items={moderationItems.slice(0, 5)} isLoading={isModerationLoading} />
      </Panel>

      <Panel
        title={t("ops.newSoundsTitle")}
        description={t("ops.newSoundsDesc")}
        action={<Badge variant="info">Admin sounds</Badge>}
      >
        <SoundList items={soundItems.slice(0, 4)} isLoading={isSoundLoading} />
      </Panel>

      <Panel
        title={t("ops.docsMapTitle")}
        description={t("ops.docsMapDesc")}
        className="xl:col-span-2"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {featureDocs.map((doc) => (
            <div key={doc.name} className="rounded-lg border border-elevated bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant="brand" size="sm">
                  {doc.files} files
                </Badge>
                <span className="text-xs font-bold text-text-muted">{doc.status}</span>
              </div>
              <p className="text-sm font-black">{doc.name}</p>
              <p className="mt-2 text-xs leading-5 text-text-muted">{doc.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function ModerationSection({
  items,
  status,
  onStatusChange,
  isLoading,
  isError,
}: {
  items: ModerationQueueItem[];
  status: string;
  onStatusChange: (status: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <Panel
      title={t("ops.videoModerationTitle")}
      description={t("ops.videoModerationDesc")}
      action={
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 rounded-lg border border-elevated bg-background px-3 text-sm font-bold outline-none focus:border-brand"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      }
    >
      {isError ? (
        <EmptyState
          icon={FileWarning}
          title={t("ops.moderationLoadErrorTitle")}
          detail={t("ops.moderationLoadErrorDesc")}
        />
      ) : (
        <ModerationList items={items} isLoading={isLoading} expanded />
      )}
    </Panel>
  );
}

function SoundsSection({
  items,
  keyword,
  onKeywordChange,
  isLoading,
  isError,
}: {
  items: SoundItem[];
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <Panel
      title={t("ops.soundManagementTitle")}
      description={t("ops.soundManagementDesc")}
      action={
        <div className="w-full max-w-xs">
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder={t("ops.soundSearchPlaceholder")}
            className="h-10 rounded-lg px-4 py-2"
          />
        </div>
      }
    >
      {isError ? (
        <EmptyState
          icon={Music2}
          title={t("ops.soundsLoadErrorTitle")}
          detail={t("ops.soundsLoadErrorDesc")}
        />
      ) : (
        <SoundList items={items} isLoading={isLoading} expanded />
      )}
    </Panel>
  );
}

function DocsSection() {
  const t = useTranslations("Admin.dashboard");

  return (
    <Panel
      title={t("ops.docsSummaryTitle")}
      description={t("ops.docsSummaryDesc")}
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<BookOpenText className="h-4 w-4" />}
        >
          20 MD files
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {featureDocs.map((doc) => (
          <div key={doc.name} className="rounded-lg border border-elevated p-5">
            <div className="mb-4 flex items-center justify-between">
              <Sparkles className="h-5 w-5 text-brand" />
              <Badge variant="info">{doc.status}</Badge>
            </div>
            <h3 className="text-base font-black">{doc.name}</h3>
            <p className="mt-2 text-sm leading-6 text-text-muted">{doc.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ModerationList({
  items,
  isLoading,
  expanded = false,
}: {
  items: ModerationQueueItem[];
  isLoading: boolean;
  expanded?: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  if (isLoading) {
    return <LoadingRows count={expanded ? 6 : 4} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("ops.emptyModerationTitle")}
        detail={t("ops.emptyModerationDesc")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-elevated">
      {items.map((item) => (
        <div
          key={item.videoId}
          className="grid grid-cols-[72px_1fr] gap-4 border-b border-elevated bg-background p-4 last:border-b-0 md:grid-cols-[84px_1fr_180px]"
        >
          <div className="relative h-24 overflow-hidden rounded-lg bg-black">
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt={item.caption ?? `Video ${item.videoId}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Video className="h-6 w-6 text-white/50" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(item.moderationStatus)}>
                {item.moderationStatus}
              </Badge>
              {(item.reportCount ?? 0) > 0 && (
                <Badge variant="error">{item.reportCount} reports</Badge>
              )}
              {typeof item.riskScore === "number" && (
                <Badge variant={item.riskScore >= 0.7 ? "error" : "warning"}>
                  risk {(item.riskScore * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="truncate text-sm font-black">
              {item.caption || `Video #${item.videoId}`}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              @{item.authorUsername || "unknown"} · {formatDate(item.createdAt)}
            </p>
            {expanded && item.categories && item.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text-muted"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="hidden items-center justify-end gap-2 md:flex">
            <Button type="button" variant="secondary" size="sm">
              {t("ops.detail")}
            </Button>
            <Button type="button" size="sm">
              {t("ops.review")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SoundList({
  items,
  isLoading,
  expanded = false,
}: {
  items: SoundItem[];
  isLoading: boolean;
  expanded?: boolean;
}) {
  const t = useTranslations("Admin.dashboard");

  if (isLoading) {
    return <LoadingRows count={expanded ? 6 : 4} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title={t("ops.emptySoundsTitle")}
        detail={t("ops.emptySoundsDesc")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((sound) => (
        <div key={sound.id} className="rounded-lg border border-elevated bg-background p-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
            <Music2 className="h-5 w-5" />
          </div>
          <p className="truncate text-sm font-black">
            {sound.title || sound.name || `Sound #${sound.id}`}
          </p>
          <p className="mt-1 truncate text-sm text-text-muted">
            {sound.artistName || sound.authorUsername || "TopTop sound"}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Badge variant="brand" size="sm">
              {sound.type || "SOUND"}
            </Badge>
            <span className="text-xs font-bold text-text-muted">
              {sound.usageCount ?? 0} uses
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-elevated bg-background ${className}`}>
      <div className="flex flex-col gap-4 border-b border-elevated p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-elevated bg-background p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Activity className="h-4 w-4 text-text-muted" />
      </div>
      <p className="text-sm font-bold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 text-text-muted">{hint}</p>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-brand text-white shadow-lg shadow-brand/20"
          : "text-text-muted hover:bg-hover hover:text-text-primary"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function MobileNav({
  activeSection,
  onChange,
}: {
  activeSection: SectionKey;
  onChange: (section: SectionKey) => void;
}) {
  const t = useTranslations("Admin.dashboard");
  const items: { key: SectionKey; label: string; icon: ElementType }[] = [
    { key: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { key: "moderation", label: t("ops.moderation"), icon: ShieldAlert },
    { key: "sounds", label: t("ops.sounds"), icon: Music2 },
    { key: "docs", label: t("ops.docs"), icon: BookOpenText },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-xs font-black ${
              activeSection === item.key
                ? "border-brand bg-brand text-white"
                : "border-elevated bg-background text-text-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-elevated bg-surface p-8 text-center">
      <Icon className="h-8 w-8 text-text-muted" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-text-muted">{detail}</p>
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-surface" />
      ))}
    </div>
  );
}

function TopTopMark() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
      <span className="absolute z-10 text-2xl font-extrabold italic tracking-tighter text-white">
        t
      </span>
      <span className="absolute -translate-x-px -translate-y-px text-2xl font-extrabold italic tracking-tighter text-cyan">
        t
      </span>
      <span className="absolute translate-x-px translate-y-px text-2xl font-extrabold italic tracking-tighter text-brand">
        t
      </span>
    </div>
  );
}

function statusVariant(status: string): "success" | "warning" | "error" | "info" | "brand" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "FAILED") return "error";
  if (status === "NEED_REVIEW") return "warning";
  if (status === "PENDING") return "info";
  return "brand";
}

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
