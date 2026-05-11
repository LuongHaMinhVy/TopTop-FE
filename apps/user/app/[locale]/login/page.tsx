"use client";

import { useEffect, useState } from "react";
import { 
  QrCode, 
  User, 
  ChevronLeft,
  X,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authLogin } from "@/services/auth-api-service";
import Facebook from "@/components/shared/icons/FaceBookIcon";
import Google from "@/components/shared/icons/GoogleIcon";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useLoginMutation, useOAuth } from "@/hooks/auth-hooks";
import type { AuthMessageData, AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

type AuthMethod = "options" | "phone_email";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("options");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const authEvent = event.data as AuthMessageData;

      if (authEvent.type === "AUTH_SUCCESS") {
        const { data } = authEvent;
        setSuccessMsg("Đăng nhập thành công");
        if (data) dispatch(setCredentials(data));
        // Small delay to ensure browser has processed cookies from the popup's last request
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }, 300);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else if (authEvent.type === "AUTH_ERROR") {
        setErrorMsg(authEvent.error || "Xác thực thất bại");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch, router]);

  const { openAuthPopup } = useOAuth();
  const loginMutation = useLoginMutation(() => {
    setSuccessMsg("Đăng nhập thành công");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  });

  const handleFacebookLogin = () => openAuthPopup('facebook');
  const handleGoogleLogin = () => openAuthPopup('google');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    loginMutation.mutate({ email, password }, {
      onError: (err: any) => {
        setErrorMsg(err.message || "Xác thực thất bại");
      }
    });
  };

  const renderOptions = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-[36px] font-bold text-center mb-6 text-text-primary">
        Đăng nhập vào TopTop
      </h2>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            setAuthMethod("phone_email");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="flex items-center w-full p-3 border border-elevated rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-text-primary bg-surface"
        >
          <User className="w-5 h-5 ml-2" />
          <span className="flex-1 text-center font-semibold text-[16px]">Sử dụng email</span>
        </button>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center w-full p-3 border border-elevated rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-text-primary bg-surface"
        >
          <Google className="w-5 h-5 ml-2" />
          <span className="flex-1 text-center font-semibold text-[16px]">Tiếp tục với Google</span>
        </button>

        <button
          onClick={handleFacebookLogin}
          className="flex items-center w-full p-3 border border-elevated rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-text-primary bg-surface"
        >
          <Facebook className="w-5 h-5 ml-2" />
          <span className="flex-1 text-center font-semibold text-[16px]">Tiếp tục với Facebook</span>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setAuthMethod("options")}
          className="p-2 -ml-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[28px] font-bold mx-auto text-text-primary">Đăng nhập</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="font-semibold text-[16px] text-text-primary">Email / Tên người dùng</span>
      </div>

      {errorMsg && (
        <div className="bg-[#F04438]/10 border border-[#F04438]/50 text-[#F04438] p-3 rounded-[4px] mb-4 text-[14px]">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-[#12B76A]/10 border border-[#12B76A]/50 text-[#12B76A] p-3 rounded-[4px] mb-4 text-[14px]">
          {successMsg}
        </div>
      )}

      <form className="flex flex-col gap-4 flex-1" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email hoặc tên người dùng"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              required
              className="input-field pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Link
          href="#"
          className="text-[14px] font-semibold text-text-secondary hover:underline hover:text-text-primary mt-2"
        >
          Quên mật khẩu?
        </Link>

        <button
          type="submit"
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          disabled={loginMutation.isPending || !email || !password}
        >
          {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          Đăng nhập
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(0,0,0,0.7)] px-4">
      <div className="w-full max-w-[480px] bg-transparent rounded-[12px] p-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative flex flex-col">
        <Link
          href="/"
          className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-[rgba(255,255,255,0.1)] hover:text-text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>

        <div className="flex-1 mt-6">
          {authMethod === "options" ? renderOptions() : renderForm()}
        </div>

        <div className="mt-8 pt-6 border-t border-elevated text-center">
          <p className="text-[12px] text-text-muted mb-6 leading-relaxed">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <Link href="#" className="text-text-primary hover:underline">Điều khoản Dịch vụ</Link>
            {" "}và xác nhận rằng bạn đã đọc{" "}
            <Link href="#" className="text-text-primary hover:underline">Chính sách Quyền riêng tư</Link> của chúng tôi.
          </p>

          <div className="flex items-center justify-center gap-2">
            <span className="text-[15px] text-text-primary">Bạn chưa có tài khoản?</span>
            <Link href="/signup" className="text-brand font-bold text-[15px] hover:underline">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}