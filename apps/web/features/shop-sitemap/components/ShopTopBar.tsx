"use client";

import { useEffect } from "react";
import { useRef, useState } from "react";
import { MoreHorizontal, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import type { RootState } from "@/store/store";
import Image from "next/image";
import { useLogoutMutation } from "@/hooks/auth-hooks";

export function ShopTopBar() {
  const t = useTranslations("ShopShell");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRootRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = Boolean(user);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!settingsOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (settingsMenuRootRef.current && !settingsMenuRootRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  return (
    <div className="shop-topbar">
      <div className="shop-topbar__inner">
        <div ref={settingsMenuRootRef} className="shop-topbar__pill">
          <button
            id="shop-topbar-profile-btn"
            className="shop-topbar__avatar-btn"
            aria-label={t("profile")}
            type="button"
            onClick={() => setSettingsOpen((value) => !value)}
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.nickname ?? user.username ?? "User"}
                width={28}
                height={28}
                className="shop-topbar__avatar-img"
              />
            ) : (
              <div className="shop-topbar__avatar-placeholder">
                <User size={15} />
              </div>
            )}
          </button>
          {!user ? (
            <button
              className="shop-topbar__more-btn"
              aria-label={t("more")}
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <MoreHorizontal className="size-5" />
            </button>
          ) : null}
          {settingsOpen && (
            <div className="shop-topbar__menu">
              <SettingsMenu
                onClose={() => setSettingsOpen(false)}
                onLogout={
                  isLoggedIn
                    ? () => {
                        logoutMutation.mutate();
                        setSettingsOpen(false);
                      }
                    : undefined
                }
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
