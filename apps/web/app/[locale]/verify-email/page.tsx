"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyEmailMutation } from "@/hooks/auth-hooks";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Không tìm thấy mã xác thực.");

  const verifyEmailMutation = useVerifyEmailMutation();

  useEffect(() => {
    if (!token) return;

    verifyEmailMutation.mutate(token, {
      onSuccess: (res) => {
        setStatus("success");
        setMessage(res.message || "Xác thực email thành công!");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      },
      onError: (err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Xác thực email thất bại");
      }
    });
  }, [token, router, verifyEmailMutation]);

  return (
    <div className="w-full max-w-[400px] bg-surface border border-elevated rounded-[12px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
          <h2 className="text-[20px] font-bold text-text-primary mb-2">Đang xác thực email</h2>
          <p className="text-[14px] text-text-secondary">Vui lòng chờ trong giây lát trong khi chúng tôi xác nhận địa chỉ email của bạn.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="w-12 h-12 text-[#12B76A] mb-4" />
          <h2 className="text-[20px] font-bold text-text-primary mb-2">Xác thực thành công</h2>
          <p className="text-[14px] text-text-secondary mb-6">{message}</p>
          <p className="text-[13px] text-text-muted">Đang chuyển hướng về trang chủ...</p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-12 h-12 text-[#F04438] mb-4" />
          <h2 className="text-[20px] font-bold text-text-primary mb-2">Xác thực thất bại</h2>
          <p className="text-[14px] text-[#F04438] mb-6">{message}</p>
          <Link href="/login" className="w-full">
            <button className="btn-primary w-full h-[44px]">Quay lại Đăng nhập</button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(0,0,0,0.7)] px-4">
      <Suspense fallback={
        <div className="w-full max-w-[400px] bg-surface border border-elevated rounded-[12px] p-8 flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-brand animate-spin" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}