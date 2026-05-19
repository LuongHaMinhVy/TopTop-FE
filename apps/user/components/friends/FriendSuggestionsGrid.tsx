"use client";

import { useFriendsSuggestions } from "@/hooks/friend-hooks";
import SuggestedFollowCard from "../following/SuggestedFollowCard";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { Lock } from "lucide-react";
import { useEffect } from "react";

interface FriendSuggestionsGridProps {
  reason: "GUEST" | "NO_FRIENDS" | "NO_VIDEOS";
}

export default function FriendSuggestionsGrid({ reason }: FriendSuggestionsGridProps) {
  const t = useTranslations("friends");
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Only enable suggestions query if user is logged in
  const { data: suggestionsData, isLoading, isError } = useFriendsSuggestions(18, !!currentUser);

  const suggestions = suggestionsData?.data ?? [];

  // Automatically trigger login modal for guests when they enter the friends page
  useEffect(() => {
    if (reason === "GUEST" && !currentUser) {
      dispatch(openAuthModal("login"));
    }
  }, [reason, currentUser, dispatch]);

  if (reason === "GUEST") {
    return (
      <div className="relative min-h-[80vh] w-full bg-background text-text-primary flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Blurred background cards for aesthetic excellence */}
        <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-8 filter blur-[6px] opacity-25 select-none pointer-events-none">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="w-full h-[290px] rounded-lg bg-surface-secondary border border-elevated flex flex-col items-center justify-between p-5">
              <div className="w-[88px] h-[88px] rounded-full bg-elevated" />
              <div className="h-4 bg-elevated rounded w-3/4 my-2" />
              <div className="h-3 bg-elevated rounded w-1/2" />
              <div className="h-8 bg-elevated rounded w-full mt-4" />
            </div>
          ))}
        </div>

        {/* Lock Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-[480px] bg-surface-secondary/80 border border-elevated rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-background border border-elevated flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary text-[#fe2c55]" />
          </div>
          <h2 className="text-[20px] md:text-[22px] font-bold text-text-primary mb-3">
            {t("title")}
          </h2>
          <p className="text-[14px] md:text-[15px] text-text-secondary leading-relaxed mb-8">
            {t("loginRequired")}
          </p>
          <button
            onClick={() => dispatch(openAuthModal("login"))}
            className="w-full bg-[#fe2c55] hover:bg-[#e02247] text-white text-[16px] font-bold py-3 rounded-lg shadow-lg shadow-[#fe2c55]/20 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-background text-text-primary px-4 py-8 md:px-8 max-w-[1000px] mx-auto">
      {/* Dynamic Status message for Logged-in empty states */}
      {reason === "NO_FRIENDS" && (
        <div className="flex flex-col items-center justify-center text-center py-6 mb-8 bg-surface-secondary/20 border border-elevated rounded-2xl p-6">
          <p className="text-[18px] font-medium text-text-secondary">
            {t("noFriends")}
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

      {/* Suggested friends heading */}
      <h2 className="text-[16px] font-bold text-text-muted uppercase tracking-wider mb-6">
        {t("suggestedFriends")}
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
            <SuggestedFollowCard key={user.id} user={user} translationNamespace="friends" />
          ))}
        </div>
      )}
    </div>
  );
}
