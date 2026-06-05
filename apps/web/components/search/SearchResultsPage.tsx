"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Heart, Search, Radio } from "lucide-react";
import { Avatar } from "@repo/ui";
import { Link, useRouter } from "@/i18n/routing";
import {
  useSaveSearchHistory,
  useSearchLive,
  useSearchTop,
  useSearchSuggestions,
  useSearchUsers,
  useSearchVideos,
} from "@/hooks/search-hooks";
import type { SearchTab, SearchUser, SearchVideo } from "@/types/search";
import { formatCount } from "@/utils/format-count";
import { videoPath } from "@/utils/video-url";
import { useFollowMutation, useUnfollowMutation } from "@/hooks/user-hooks";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { DocumentTitle, truncateTitle } from "@/components/shared/DocumentTitle";
import { useTranslations } from "next-intl";

const SEARCH_TABS: Array<{ value: SearchTab; labelKey: string }> = [
  { value: "top", labelKey: "tabs.top" },
  { value: "users", labelKey: "tabs.users" },
  { value: "videos", labelKey: "tabs.videos" },
  { value: "live", labelKey: "tabs.live" },
];

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q")?.trim() ?? "";
  const activeTab = normalizeTab(searchParams.get("tab"));
  const saveHistory = useSaveSearchHistory();
  const isLoggedIn = useSelector((state: RootState) => Boolean(state.auth.user));
  const t = useTranslations("searchPage");

  const topQuery = useSearchTop(q);
  const usersQuery = useSearchUsers(q, 0, 30, activeTab === "users");
  const videosQuery = useSearchVideos(q, 0, 30, activeTab === "videos");
  const liveQuery = useSearchLive(q, 0, 30, activeTab === "live");
  const suggestionsQuery = useSearchSuggestions(q, q.length > 0);
  const didYouMean = suggestionsQuery.data?.data?.didYouMean?.trim();

  const relatedSearches = useMemo(() => {
    if (activeTab === "top") return topQuery.data?.data?.relatedSearches ?? [];
    return topQuery.data?.data?.relatedSearches ?? [];
  }, [activeTab, topQuery.data?.data?.relatedSearches]);

  const switchTab = (tab: SearchTab) => {
    router.push(`/search?q=${encodeURIComponent(q)}&tab=${tab}`);
  };

  const submitRelated = (keyword: string) => {
    if (isLoggedIn) {
      saveHistory.mutate({ keyword, type: "ALL" });
    }
    router.push(`/search?q=${encodeURIComponent(keyword)}&tab=top`);
  };

  return (
    <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
      <DocumentTitle title={q ? `${truncateTitle(q, 50)} | Search | TopTop` : "Search | TopTop"} />
      <div className="mx-auto grid max-w-[1540px] grid-cols-1 gap-8 px-6 pb-16 pt-0 lg:grid-cols-[minmax(0,1fr)_240px] xl:px-10">
        <main className="min-w-0">
          <div className="sticky top-0 z-20 border-b border-elevated bg-background/95 backdrop-blur">
            <nav className="flex h-[74px] items-end gap-14 overflow-x-auto">
              {SEARCH_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => switchTab(tab.value)}
                  className={`relative h-full min-w-[90px] px-2 pt-7 text-[18px] font-bold ${
                    activeTab === tab.value ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {t(tab.labelKey)}
                  {activeTab === tab.value && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-text-primary" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {!q ? (
            <SearchEmpty title={t("empty.enterKeyword")} />
          ) : (
            <>
              {didYouMean && didYouMean.toLowerCase() !== q.toLowerCase() ? (
                <button
                  type="button"
                  onClick={() => submitRelated(didYouMean)}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-elevated px-5 text-[16px] font-bold hover:bg-hover"
                >
                  <Search className="size-4 text-brand" />
                  Ý bạn là: <span className="text-text-primary">{didYouMean}</span>
                </button>
              ) : null}
              {activeTab === "top" ? (
                <TopResults
                  isLoading={topQuery.isLoading}
                  videos={topQuery.data?.data?.videos ?? []}
                  users={topQuery.data?.data?.users ?? []}
                  query={q}
                  onSeeUsers={() => switchTab("users")}
                  labels={{
                    users: t("sections.users"),
                    seeMore: t("actions.seeMore"),
                    noResults: t("empty.noResults"),
                  }}
                />
              ) : activeTab === "users" ? (
                <UserResults isLoading={usersQuery.isLoading} users={usersQuery.data?.data ?? []} emptyTitle={t("empty.noUsers")} />
              ) : activeTab === "videos" ? (
                <VideoResults isLoading={videosQuery.isLoading} videos={videosQuery.data?.data ?? []} query={q} emptyTitle={t("empty.noVideos")} />
              ) : (
                <LiveResults isLoading={liveQuery.isLoading} count={liveQuery.data?.data?.length ?? 0} emptyTitle={t("empty.noMoreResults")} />
              )}
            </>
          )}
        </main>

        <aside className="hidden pt-[104px] lg:block">
          <div className="sticky top-[104px]">
            <h2 className="mb-4 text-[18px] font-extrabold leading-tight text-text-muted">
              {t("relatedTitle")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {(relatedSearches.length > 0 ? relatedSearches.map((item) => item.keyword) : [q])
                .filter(Boolean)
                .slice(0, 8)
                .map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => submitRelated(keyword)}
                    className="flex h-10 items-center gap-2 rounded-full bg-elevated px-4 text-[16px] font-bold hover:bg-hover"
                  >
                    <Search className="size-4" />
                    {keyword}
                  </button>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TopResults({
  isLoading,
  videos,
  users,
  query,
  onSeeUsers,
  labels,
}: {
  isLoading: boolean;
  videos: SearchVideo[];
  users: SearchUser[];
  query: string;
  onSeeUsers: () => void;
  labels: {
    users: string;
    seeMore: string;
    noResults: string;
  };
}) {
  if (isLoading) return <SearchSkeleton />;

  if (videos.length === 0 && users.length === 0) {
    return <SearchEmpty title={labels.noResults} />;
  }

  return (
    <div className="space-y-8 py-8">
      <VideoGrid videos={videos.slice(0, 4)} query={query} />
      {users.length > 0 && (
        <section className="border-t border-elevated pt-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold">{labels.users}</h2>
            <button
              type="button"
              onClick={onSeeUsers}
              className="text-[16px] font-bold hover:underline"
            >
              {labels.seeMore}
            </button>
          </div>
          <div className="grid gap-x-8 gap-y-5 xl:grid-cols-2">
            {users.slice(0, 4).map((user) => (
              <SearchUserRow key={user.id} user={user} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function UserResults({ isLoading, users, emptyTitle }: { isLoading: boolean; users: SearchUser[]; emptyTitle: string }) {
  if (isLoading) return <SearchSkeleton rowsOnly />;
  if (users.length === 0) return <SearchEmpty title={emptyTitle} />;

  return (
    <div className="py-8">
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <SearchUserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function VideoResults({ isLoading, videos, query, emptyTitle }: { isLoading: boolean; videos: SearchVideo[]; query: string; emptyTitle: string }) {
  if (isLoading) return <SearchSkeleton />;
  if (videos.length === 0) return <SearchEmpty title={emptyTitle} />;

  return (
    <div className="py-8">
      <VideoGrid videos={videos} query={query} />
    </div>
  );
}

function LiveResults({ isLoading, count, emptyTitle }: { isLoading: boolean; count: number; emptyTitle: string }) {
  if (isLoading) return <SearchSkeleton />;
  return (
    <div className="py-8">
      <div className="grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {count > 0 ? null : (
          <div className="col-span-full flex h-[360px] flex-col items-center justify-center text-text-muted">
            <Radio className="mb-4 size-14" />
            <p className="text-[22px] font-semibold">{emptyTitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoGrid({ videos, query }: { videos: SearchVideo[]; query: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={videoPath(video.author.username, video.id, { from: "search", q: query })}
          className="group min-w-0"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-elevated">
            <Image
              src={video.coverUrl || video.videoUrl || "/images/default-video-cover.png"}
              alt={video.caption}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[18px] font-bold text-white">
              <Heart className="size-5" />
              {formatCount(video.likeCount)}
            </div>
          </div>
          <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-snug">
            {video.caption}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-text-secondary">
            <Avatar src={video.author.avatarUrl ?? undefined} alt={video.author.displayName} size="xs" />
            <span className="truncate">{video.author.username}</span>
            <span className="ml-auto flex-shrink-0">
              {new Date(video.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SearchUserRow({ user, compact = false }: { user: SearchUser; compact?: boolean }) {
  const followMutation = useFollowMutation(user.username);
  const unfollowMutation = useUnfollowMutation(user.username);
  const t = useTranslations("searchPage");
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <div className={`flex items-center gap-4 rounded-lg px-3 py-3 hover:bg-hover ${compact ? "" : "min-h-[104px]"}`}>
      <Link href={`/@${user.username}`} className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar src={user.avatarUrl ?? undefined} alt={user.displayName} size={compact ? "lg" : "xl"} />
        <div className="min-w-0">
          <h3 className="truncate text-[19px] font-extrabold">{user.displayName || user.username}</h3>
          <p className="truncate text-[16px] font-semibold">{user.username}</p>
          <p className="truncate text-[15px] text-text-secondary">
            {formatCount(user.followerCount)} {t("counts.followers")} <span className="px-1">·</span>
            {formatCount(user.totalLikeCount)} {t("counts.likes")}
          </p>
        </div>
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (user.followed) {
            unfollowMutation.mutate();
          } else {
            followMutation.mutate();
          }
        }}
        className={`h-10 min-w-[120px] rounded-full px-6 text-[18px] font-bold transition disabled:opacity-60 ${
          user.followed ? "bg-elevated text-text-primary hover:bg-hover" : "bg-brand text-white hover:bg-brand/90"
        }`}
      >
        {user.followed ? t("actions.following") : t("actions.follow")}
      </button>
    </div>
  );
}

function SearchEmpty({ title }: { title: string }) {
  return (
    <div className="flex h-[520px] flex-col items-center justify-center text-center text-text-muted">
      <Search className="mb-5 size-16 opacity-40" />
      <p className="text-[22px] font-bold">{title}</p>
    </div>
  );
}

function SearchSkeleton({ rowsOnly = false }: { rowsOnly?: boolean }) {
  if (rowsOnly) {
    return (
      <div className="space-y-4 py-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[96px] animate-pulse rounded-lg bg-elevated" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-elevated" />
          <div className="h-5 animate-pulse rounded bg-elevated" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-elevated" />
        </div>
      ))}
    </div>
  );
}

function normalizeTab(value: string | null): SearchTab {
  if (value === "users" || value === "videos" || value === "live") return value;
  return "top";
}
