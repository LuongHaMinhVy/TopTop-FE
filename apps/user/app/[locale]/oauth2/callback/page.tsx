"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { useOAuth2Exchange } from "@/hooks/useOAuth2Exchange";
import { AuthResponse } from "@/types/auth";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const state = searchParams.get("state");

  const { data, isSuccess, isError } = useOAuth2Exchange(state);

  useEffect(() => {
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
  }, [state, isSuccess, isError, data, router, dispatch]);

  return null;
}

export default function OAuth2CallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FE2C55]" />
      <h2 className="text-[20px] font-semibold text-text-primary">Đang xác thực...</h2>
      <p className="text-[14px] text-gray-400 mt-2">
        Vui lòng chờ trong giây lát, hệ thống đang đăng nhập cho bạn.
      </p>

      <Suspense fallback={null}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}