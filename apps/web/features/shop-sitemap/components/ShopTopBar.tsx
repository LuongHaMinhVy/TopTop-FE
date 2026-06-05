"use client";

import { User } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import Image from "next/image";

export function ShopTopBar() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="shop-topbar">
      <div className="shop-topbar__inner">
        <div className="shop-topbar__pill">
          <div className="shop-topbar__divider" aria-hidden="true" />
          <button
            id="shop-topbar-profile-btn"
            className="shop-topbar__avatar-btn"
            aria-label="Profile"
            type="button"
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
        </div>
      </div>
    </div>
  );
}
