"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { useOAuth2Exchange } from "@/hooks/useOAuth2Exchange";
import { AuthResponse } from "@/types/auth";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  const { data, isSuccess, isError } = useOAuth2Exchange(error ? null : state);

  useEffect(() => {
    if (error) {
      const channel = new BroadcastChannel("oauth_channel");
      channel.postMessage({
        type: "AUTH_ERROR",
        error: errorMessage || error,
      });
      channel.close();
      setTimeout(() => window.close(), 700);
      return;
    }

    if (!state) {
      const channel = new BroadcastChannel("oauth_channel");
      channel.postMessage({ type: "AUTH_ERROR", error: "missing_state" });
      channel.close();
      setTimeout(() => window.close(), 300);
      return;
    }

    if (isSuccess && data) {
      const authData: AuthResponse = (data.data && 'user' in data.data) 
        ? data.data 
        : (data as unknown as AuthResponse);

      const channel = new BroadcastChannel("oauth_channel");
      channel.postMessage({ type: "AUTH_SUCCESS", data: authData });
      channel.close();
      setTimeout(() => window.close(), 300);
    }

    if (isError) {
      const channel = new BroadcastChannel("oauth_channel");
      channel.postMessage({ type: "AUTH_ERROR", error: "oauth2_failed" });
      channel.close();
      setTimeout(() => window.close(), 300);
    }
  }, [state, error, errorMessage, isSuccess, isError, data, router, dispatch]);

  return null;
}

function OAuth2CallbackShell() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-text-primary">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-brand">
        {error ? <AlertCircle className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
      </div>
      <h2 className="text-xl font-black">
        {error ? "Không thể đăng nhập" : "Đang xác thực"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
        {error
          ? errorMessage || "Cửa sổ này sẽ tự đóng, vui lòng thử lại."
          : "Vui lòng chờ trong giây lát, cửa sổ này sẽ tự đóng khi hoàn tất."}
      </p>

      <CallbackContent />
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuth2CallbackShell />
    </Suspense>
  );
}
