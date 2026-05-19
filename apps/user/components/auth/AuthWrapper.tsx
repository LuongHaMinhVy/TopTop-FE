"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import AuthModal from "./AuthModal";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/routing";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { openAuthModal, closeAuthModal, clearCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasShownModal, setHasShownModal] = useState(false);
  const { isAuthModalOpen, authModalType, isNotFound } = useSelector((state: RootState) => state.auth);

  const isSkipPage = pathname === "/login" || 
                     pathname === "/signup" || 
                     pathname.startsWith("/oauth2") || 
                     pathname === "/verify-email" || 
                     pathname.includes("/maintenance") || 
                     isNotFound;

  const { isLoading } = useCurrentUser(!isSkipPage);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const queryClient = useQueryClient();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleAuthExpired = () => {
      const wasLoggedIn = !!userRef.current;
      dispatch(clearCredentials());
      queryClient.setQueryData(["currentUser"], null);
      if (wasLoggedIn) {
        dispatch(openAuthModal("login"));
      }
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [dispatch, queryClient]);

  useEffect(() => {
    if (user && user.roles?.includes("ROLE_ADMIN")) {
      dispatch(clearCredentials());
      queryClient.setQueryData(["currentUser"], null);
    }
  }, [user, dispatch, queryClient]);

  useEffect(() => {
    if (isLoading || user || isSkipPage || hasShownModal) return;

    const timer = setTimeout(() => {
      setHasShownModal(true);
      dispatch(openAuthModal("login"));
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, user, isSkipPage, hasShownModal, dispatch]);

  return (
    <>
      {children}
      {isAuthModalOpen && !isSkipPage && (
        <div className="z-999! fixed inset-0 w-screen h-screen">
          <AuthModal 
            onClose={() => dispatch(closeAuthModal())} 
            initialType={authModalType}
          />
        </div>
      )}
    </>
  );
}
