"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authRegister } from "@/services/auth-api-service";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import AuthModal from "@/components/auth/AuthModal";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import type { AuthMessageData, AuthResponse } from "@/types/auth";

type AuthMethod = "options" | "phone_email";

export default function SignupPage() {

  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("options");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tempAuthData, setTempAuthData] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("oauth_channel");

    channel.onmessage = (event) => {
      const authEvent = event.data as AuthMessageData;

      if (authEvent.type === "AUTH_SUCCESS") {
        const { data } = authEvent;
        const responseData = data as AuthResponse;
        const user = responseData && 'user' in responseData ? responseData.user : responseData;
        if (user && user.onboarded === false) {
          setTempAuthData(responseData);
          return;
        }

        setSuccessMsg("Đăng ký thành công");
        if (authEvent.data) {
          dispatch(setCredentials(authEvent.data));
          if (user) {
            queryClient.setQueryData(["currentUser"], { data: user });
          }
        }
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

      channel.close();
    };

    return () => channel.close();
  }, [dispatch, router, queryClient]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [dob, setDob] = useState({
    month: "",
    day: "",
    year: ""
  });

  const updateDob = (updates: Partial<typeof dob>) => {
    const newDob = { ...dob, ...updates };
    setDob(newDob);
    if (newDob.month && newDob.day && newDob.year) {
      const month = newDob.month.padStart(2, '0');
      const day = newDob.day.padStart(2, '0');
      setDateOfBirth(`${newDob.year}-${month}-${day}`);
    } else {
      setDateOfBirth("");
    }
  };

  const years = Array.from({ length: 121 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const validateForm = () => {
    if (username.length < 2 || username.length > 24) {
      return "Tên người dùng phải từ 2 đến 24 ký tự.";
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return "Tên người dùng chỉ có thể chứa chữ cái, số, dấu chấm và dấu gạch dưới.";
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Định dạng email không hợp lệ.";
    }

    if (password.length < 8 || password.length > 20) {
      return "Mật khẩu phải từ 8 đến 20 ký tự.";
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/.test(password)) {
      return "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt (@$!%*?&#).";
    }

    if (!dob.month || !dob.day || !dob.year) {
      return "Vui lòng chọn ngày sinh.";
    }

    const yearNum = Number(dob.year);
    const monthNum = Number(dob.month);
    const dayNum = Number(dob.day);

    const today = new Date();
    const birthDate = new Date(yearNum, monthNum - 1, dayNum);

    // Leap year / day count check
    if (
      birthDate.getFullYear() !== yearNum ||
      birthDate.getMonth() !== monthNum - 1 ||
      birthDate.getDate() !== dayNum
    ) {
      return "Ngày sinh không hợp lệ.";
    }

    // Min 13 years old check
    let age = today.getFullYear() - yearNum;
    const monthDiff = today.getMonth() - (monthNum - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dayNum)) {
      age--;
    }

    if (age < 13) {
      return "Bạn phải từ 13 tuổi trở lên để đăng ký.";
    }

    if (birthDate > today) {
      return "Ngày sinh không thể ở tương lai.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await authRegister({ username, email, password, dateOfBirth });

      setSuccessMsg(response.message || "Đăng ký thành công");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xác thực thất bại";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOptions = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-[36px] font-bold text-center mb-6 text-text-primary">
        Đăng ký TopTop
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
          <span className="flex-1 text-center font-semibold text-[16px]">Sử dụng email / tên người dùng</span>
        </button>

        <SocialLoginButtons />
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
        <h2 className="text-[28px] font-bold mx-auto text-text-primary">
          Đăng ký
        </h2>
        <div className="w-10"></div>
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
            type="text"
            placeholder="Tên người dùng"
            required
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
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
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[13px] font-bold text-text-muted uppercase tracking-wider ml-1 mb-1">
              Ngày sinh
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  required
                  className="input-field cursor-pointer w-full appearance-none pr-8 text-[15px]"
                  value={dob.month}
                  onChange={(e) => updateDob({ month: e.target.value })}
                >
                  <option value="" disabled hidden className="bg-background text-text-primary opacity-100">Tháng</option>
                  {months.map((m) => (
                    <option key={m} value={m} className="bg-background text-text-primary">Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1">
                <select
                  required
                  className="input-field cursor-pointer w-full appearance-none pr-8 text-[15px]"
                  value={dob.day}
                  onChange={(e) => updateDob({ day: e.target.value })}
                >
                  <option value="" disabled hidden className="bg-background text-text-primary opacity-100">Ngày</option>
                  {days.map((d) => (
                    <option key={d} value={d} className="bg-background text-text-primary">{d}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1">
                <select
                  required
                  className="input-field cursor-pointer w-full appearance-none pr-8 text-[15px]"
                  value={dob.year}
                  onChange={(e) => updateDob({ year: e.target.value })}
                >
                  <option value="" disabled hidden className="bg-background text-text-primary opacity-100">Năm</option>
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-background text-text-primary">{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          disabled={isLoading || !email || !password || !username || !dateOfBirth}
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          Đăng ký
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(0,0,0,0.7)] px-4">
      <DocumentTitle title="Sign up | TopTop" />
      <div className="w-full max-w-[480px] bg-transparent rounded-[12px] p-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative flex flex-col">
      

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
            <span className="text-[15px] text-text-primary">
              Bạn đã có tài khoản?
            </span>
            <Link 
              href="/login"
              className="text-brand font-bold text-[15px] hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
        </div>

      </div>
      {tempAuthData && (
        <AuthModal 
          onClose={() => setTempAuthData(null)}
          initialMethod="onboard_dob"
          tempAuthData={tempAuthData}
        />
      )}
    </div>
  );
}
