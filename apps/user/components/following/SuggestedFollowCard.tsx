"use client";

import { UserInfo } from "@/types/user";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useDynamicFollowMutation, useDynamicUnfollowMutation } from "@/hooks/user-hooks";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface SuggestedFollowCardProps {
  user: UserInfo;
  translationNamespace?: "following" | "friends";
}

export default function SuggestedFollowCard({ user, translationNamespace = "following" }: SuggestedFollowCardProps) {
  const t = useTranslations(translationNamespace);
  const dispatch = useDispatch();
  const router = useRouter();
  const locale = useLocale();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const followMutation = useDynamicFollowMutation();
  const unfollowMutation = useDynamicUnfollowMutation();

  const isFollowing = user.relationship?.isFollowing;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentUser) {
      dispatch(openAuthModal("login"));
      return;
    }

    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(user.username);
      } else {
        await followMutation.mutateAsync(user.username);
      }
    } catch (error) {
      console.error("Follow operation failed", error);
    }
  };

  const displayName = user.nickname || user.username;

  const getButtonText = () => {
    if (isFollowing) {
      if (user.relationship?.isFollower) {
        return translationNamespace === "friends" ? t("friends") : t("following");
      }
      return t("following");
    }
    if (user.relationship?.isFollower) {
      return translationNamespace === "friends" ? t("followBack") : t("follow");
    }
    return translationNamespace === "friends" ? t("followBack") : t("follow"); // Fallback if friends suggested
  };

  return (
    <div 
      onClick={() => router.push(`/${locale}/@${user.username}`)}
      className="relative w-full h-[290px] rounded-lg overflow-hidden bg-surface-secondary border border-elevated hover:border-text-muted/30 transition-all duration-300 shadow-lg group cursor-pointer flex flex-col items-center justify-between p-5"
    >
      {/* Blurred cover background */}
      <div className="absolute top-0 left-0 right-0 h-[100px] overflow-hidden z-0">
        {user.coverUrl || user.avatarUrl ? (
          <img 
            src={user.coverUrl || user.avatarUrl} 
            alt="" 
            className="w-full h-full object-cover filter blur-[4px] brightness-[0.5] scale-105 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary to-transparent" />
      </div>

      {/* Avatar */}
      <div className="relative z-10 mt-6 flex-shrink-0">
        <div className="w-[88px] h-[88px] rounded-full overflow-hidden border-2 border-surface-secondary shadow-xl bg-zinc-800">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[#fe2c55] to-purple-600">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="relative z-10 text-center w-full mt-2 flex flex-col flex-1 justify-center">
        <h3 className="text-[16px] font-bold text-text-primary leading-5 truncate px-2 hover:underline">
          {displayName}
        </h3>
        <p className="text-[12px] text-text-secondary mt-0.5 truncate px-2">
          @{user.username}
        </p>
      </div>

      {/* Follow Button */}
      <div className="relative z-10 w-full mt-4">
        <button
          onClick={handleFollowClick}
          disabled={isPending}
          className={`w-full py-1.5 rounded text-[14px] font-semibold transition-all duration-200 ${
            isFollowing
              ? "bg-elevated hover:bg-hover text-text-primary border border-text-muted/10"
              : "bg-[#fe2c55] hover:bg-[#e02247] text-white"
          }`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
