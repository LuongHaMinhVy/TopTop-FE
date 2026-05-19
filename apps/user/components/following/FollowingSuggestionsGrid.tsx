"use client";

import { useFollowingSuggestions } from "@/hooks/following-hooks";
import SuggestedFollowCard from "./SuggestedFollowCard";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { openAuthModal } from "@/store/slices/authSlice";

interface FollowingSuggestionsGridProps {
  reason: "GUEST" | "NO_FOLLOWING" | "NO_VIDEOS";
}

export default function FollowingSuggestionsGrid({ reason }: FollowingSuggestionsGridProps) {
  const t = useTranslations("following");
  const dispatch = useDispatch();
  const { data: suggestionsData, isLoading, isError } = useFollowingSuggestions(18);

  const suggestions = suggestionsData?.data ?? [];

  return (
    <div className="min-h-full w-full bg-background text-text-primary px-4 py-8 md:px-8 max-w-[1000px] mx-auto">
      {/* Top Banner / Call to Action */}
      {reason === "GUEST" && (
        <div className="flex flex-col items-center justify-center text-center py-10 mb-8 border border-elevated bg-surface-secondary/30 rounded-2xl p-6 backdrop-blur-md">
          <p className="text-[18px] md:text-[20px] font-medium text-text-secondary max-w-[450px]">
            {t("loginRequired")}
          </p>
          <button
            onClick={() => dispatch(openAuthModal("login"))}
            className="mt-6 bg-[#fe2c55] hover:bg-[#e02247] text-white text-[16px] font-bold py-2.5 px-16 rounded-md shadow-lg shadow-[#fe2c55]/20 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {t("login")}
          </button>
        </div>
      )}

      {reason === "NO_FOLLOWING" && (
        <div className="flex flex-col items-center justify-center text-center py-6 mb-8 bg-surface-secondary/20 border border-elevated rounded-2xl p-6">
          <p className="text-[18px] font-medium text-text-secondary">
            {t("noFollowing")}
          </p>
        </div>
      )}

      {reason === "NO_VIDEOS" && (
        <div className="flex flex-col items-center justify-center text-center py-6 mb-8 bg-surface-secondary/20 border border-elevated rounded-2xl p-6">
          <p className="text-[18px] font-medium text-text-secondary">
            {t("noVideos")}
          </p>
        </div>
      )}

      {/* Suggested accounts heading */}
      <h2 className="text-[16px] font-bold text-text-muted uppercase tracking-wider mb-6">
        {t("suggestedAccounts")}
      </h2>

      {/* Loading & Grid State */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="w-full h-[290px] rounded-lg bg-surface-secondary/40 animate-pulse border border-elevated flex flex-col items-center justify-between p-5">
              <div className="w-[88px] h-[88px] rounded-full bg-elevated" />
              <div className="h-4 bg-elevated rounded w-3/4 my-2" />
              <div className="h-3 bg-elevated rounded w-1/2" />
              <div className="h-8 bg-elevated rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-text-muted">{t("loadError")}</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">{t("noSuggestions")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {suggestions.map((user) => (
            <SuggestedFollowCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
