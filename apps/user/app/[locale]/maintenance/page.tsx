"use client";

import { ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui";
import { useState } from "react";

export default function MaintenancePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_END_URL}/api/v1/users/me`, {
        method: 'GET',
        headers: { 'X-App-Id': 'toptopuser' }
      });

      if (response.status !== 503) {
        window.location.href = "/";
      } else {
        throw new Error("Still down");
      }
    } catch (err) {
      console.error("Retry failed:", err);
      setRetryError(true);
      setTimeout(() => setRetryError(false), 3000);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 is-maintenance-page">
      <div className="max-w-[480px] w-full text-center animate-in zoom-in duration-500">
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-brand/20 blur-[60px] rounded-full animate-pulse"></div>
          <div className="relative bg-surface p-8 rounded-[32px] border border-elevated shadow-2xl">
            <ServerCrash size={64} className="text-brand animate-bounce-slow" />
          </div>
        </div>

        <h1 className="text-[32px] font-extrabold text-text-primary mb-4 tracking-tight">
          Oops! Máy chủ đang nghỉ ngơi
        </h1>
        
        <p className="text-text-secondary text-[16px] leading-relaxed mb-10 px-4">
          Chúng tôi không thể kết nối tới hệ thống lúc này. Có vẻ như máy chủ đang được bảo trì hoặc gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.
        </p>

        <div className="flex flex-col gap-4">
          <Button 
            size="xl" 
            onClick={handleRetry}
            disabled={isRetrying}
            className={`w-full h-14 text-[16px] font-bold shadow-lg transition-all duration-300 ${
              retryError ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "shadow-brand/20"
            }`}
          >
            {retryError ? (
              "Máy chủ vẫn chưa sẵn sàng..."
            ) : (
              <>
                <RefreshCw size={20} className={`mr-2 ${isRetrying ? "animate-spin" : ""}`} />
                Thử kết nối lại
              </>
            )}
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-elevated opacity-50">
          <p className="text-[12px] text-text-muted font-medium uppercase tracking-[2px]">
            Error Code: SERVER_CONNECTION_LOST
          </p>
        </div>
      </div>
    </div>
  );
}
