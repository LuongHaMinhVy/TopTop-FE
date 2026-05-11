"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import AuthModal from "./AuthModal";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { openAuthModal, closeAuthModal, clearCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useCurrentUser();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { isAuthModalOpen, authModalType } = useSelector((state: RootState) => state.auth);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(clearCredentials());
      queryClient.setQueryData(["currentUser"], null);
      dispatch(openAuthModal("login"));
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [dispatch, queryClient]);

  useEffect(() => {
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/oauth2") || pathname === "/verify-email";
    
    if (isLoading || user || isAuthPage) return;

    if (sessionStorage.getItem("initial_auth_modal_shown")) return;

    sessionStorage.setItem("initial_auth_modal_shown", "true");

    const timer = setTimeout(() => {
      dispatch(openAuthModal("login"));
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, user, pathname, dispatch]);

  return (
    <>
      {children}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => dispatch(closeAuthModal())} 
        initialType={authModalType}
      />
    </>
  );
}
