"use client";

import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import { Clock, MoreHorizontal, Search, TrendingUp, X } from "lucide-react";
import { Avatar } from "@repo/ui";
import { useRouter } from "@/i18n/routing";
import { useSaveSearchHistory, useSearchHistory, useSearchSuggestions } from "@/hooks/search-hooks";

interface SearchOverlayProps {
  query: string;
  setQuery: (query: string) => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  isLoggedIn: boolean;
}

export function SearchOverlay({
  query,
  setQuery,
  onClose,
  inputRef,
  isLoggedIn,
}: SearchOverlayProps) {
  const router = useRouter();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const normalizedQuery = debouncedQuery.trim();
  const { data: suggestionsRes } = useSearchSuggestions(normalizedQuery, normalizedQuery.length > 0);
  const { historyQuery, deleteMutation, clearMutation } = useSearchHistory(isLoggedIn);
  const saveHistory = useSaveSearchHistory();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const keywords = useMemo(() => {
    const fromApi = suggestionsRes?.data?.keywords ?? [];
    if (fromApi.length > 0) return fromApi;
    if (normalizedQuery) return [normalizedQuery];
    return [];
  }, [normalizedQuery, suggestionsRes?.data?.keywords]);

  const submitSearch = (keyword: string) => {
    const nextKeyword = keyword.trim();
    if (!nextKeyword) return;

    if (isLoggedIn) {
      saveHistory.mutate({ keyword: nextKeyword, type: "ALL" });
    }

    onClose();
    router.push(`/search?q=${encodeURIComponent(nextKeyword)}&tab=top`);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-4 px-5 pb-4 pt-7">
        <div className="grid size-12 flex-shrink-0 place-items-center rounded-full bg-elevated/70 text-text-primary">
          <Search className="size-6" />
        </div>
        <h2 className="min-w-0 flex-1 text-[28px] font-extrabold leading-none">
          Tìm kiếm
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-elevated text-text-primary hover:bg-hover"
        >
          <X className="size-5" />
        </button>
      </div>

      <form
        className="px-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(query);
        }}
      >
        <div className="flex h-[52px] items-center gap-3 rounded-full border border-elevated bg-elevated px-4">
          <Search className="size-5 flex-shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm"
            className="h-full min-w-0 flex-1 bg-transparent text-[18px] font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid size-5 flex-shrink-0 place-items-center rounded-full bg-text-muted/40 text-background hover:bg-text-secondary"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 custom-scrollbar">
        <div className="flex flex-col">
          {query.trim() ? (
            keywords.map((keyword, index) => (
              <button
                key={`${keyword}-${index}`}
                type="button"
                onClick={() => submitSearch(keyword)}
                className="group flex h-[50px] items-center gap-4 px-5 text-left hover:bg-hover"
              >
                <Search className="size-5 flex-shrink-0 text-text-secondary" />
                <span className="truncate text-[20px] font-bold">{keyword}</span>
                {index === keywords.length - 1 && (
                  <MoreHorizontal className="ml-auto size-5 text-text-muted opacity-70" />
                )}
              </button>
            ))
          ) : (
            <>
              {isLoggedIn && (historyQuery.data?.data?.length ?? 0) > 0 && (
                <section className="mb-5">
                  <div className="mb-2 flex items-center justify-between px-4">
                    <span className="text-[15px] font-bold text-text-muted">Lịch sử tìm kiếm</span>
                    <button
                      type="button"
                      onClick={() => clearMutation.mutate()}
                      className="text-[13px] font-bold text-text-secondary hover:text-text-primary"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  {historyQuery.data?.data?.map((item) => (
                    <div key={item.id} className="group flex h-[48px] items-center gap-4 px-5 hover:bg-hover">
                      <Clock className="size-5 flex-shrink-0 text-text-secondary" />
                      <button
                        type="button"
                        onClick={() => submitSearch(item.keyword)}
                        className="min-w-0 flex-1 truncate text-left text-[18px] font-bold"
                      >
                        {item.keyword}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="grid size-7 place-items-center rounded-full text-text-muted hover:bg-elevated hover:text-text-primary"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </section>
              )}

              <section>
                <div className="mb-2 px-4 text-[15px] font-bold text-text-muted">
                  Gợi ý cho bạn
                </div>
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => submitSearch(keyword)}
                      className="flex h-[48px] w-full items-center gap-4 px-5 text-left hover:bg-hover"
                    >
                      <TrendingUp className="size-5 flex-shrink-0 text-brand" />
                      <span className="truncate text-[18px] font-bold">{keyword}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-5 py-4 text-[15px] font-semibold text-text-muted">
                    Nhập từ khóa để xem gợi ý.
                  </p>
                )}
              </section>
            </>
          )}

          {(suggestionsRes?.data?.users?.length ?? 0) > 0 && (
            <section className="mt-2">
              <div className="mb-2 px-4 text-[15px] font-bold text-text-muted">
                Tài khoản
              </div>
              {suggestionsRes?.data?.users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/@${user.username}`);
                  }}
                  className="flex w-full items-center gap-4 px-5 py-2.5 text-left hover:bg-hover"
                >
                  <Avatar src={user.avatarUrl ?? undefined} alt={user.displayName} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-[19px] font-bold">{user.username}</p>
                    <p className="truncate text-[15px] font-semibold text-text-muted">
                      {user.displayName}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
