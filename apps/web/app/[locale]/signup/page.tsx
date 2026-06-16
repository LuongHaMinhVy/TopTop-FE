"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  ChevronLeft
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
import { Button, Input, Select, Form } from "@repo/ui";
import { useTranslations } from "next-intl";

type AuthMethod = "options" | "phone_email";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const t = useTranslations("auth");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("options");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; dob?: string }>({});
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

        setSuccessMsg(t("successRegister"));
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
        setErrorMsg(authEvent.error || t("errorAuth"));
      }

      channel.close();
    };

    return () => channel.close();
  }, [dispatch, router, queryClient, t]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const newErrors: typeof errors = {};

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      newErrors.username = t("errUsernameLength");
    } else {
      if (cleanUsername.length < 2 || cleanUsername.length > 24) {
        newErrors.username = t("errUsernameLength");
      }
      if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
        newErrors.username = t("errUsernamePattern");
      }
    }
    
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      newErrors.email = t("errEmailPattern");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = t("errEmailPattern");
    }

    if (!password) {
      newErrors.password = t("errPasswordRequired");
    } else {
      if (password.length < 8 || password.length > 20) {
        newErrors.password = t("errPasswordLength");
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/.test(password)) {
        newErrors.password = t("errPasswordPattern");
      }
    }

    if (!dob.month || !dob.day || !dob.year) {
      newErrors.dob = t("errSelectDob");
    } else {
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
        newErrors.dob = t("errInvalidDob");
      } else {
        // Min 13 years old check
        let age = today.getFullYear() - yearNum;
        const monthDiff = today.getMonth() - (monthNum - 1);
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dayNum)) {
          age--;
        }

        if (age < 13) {
          newErrors.dob = t("errAgeRestriction");
        } else if (birthDate > today) {
          newErrors.dob = t("errFutureDob");
        }
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");
    setSuccessMsg("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authRegister({ username: username.trim(), email: email.trim(), password, dateOfBirth });

      setSuccessMsg(response.message || t("successRegister"));
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errorAuth");
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOptions = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-[36px] font-bold text-center mb-6 text-text-primary">
        {t("signupTo")}
      </h2>

      <div className="flex flex-col gap-4">
        <Button 
          onClick={() => {
            setAuthMethod("phone_email");
            setErrorMsg("");
            setSuccessMsg("");
            setErrors({});
          }}
          variant="outline"
          className="w-full justify-start rounded-lg p-3 text-[16px]"
          leftIcon={<User className="w-5 h-5 ml-2" />}
        >
          <span className="flex-1 text-center font-semibold">{t("useEmail")}</span>
        </Button>

        <SocialLoginButtons />
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <Button 
          onClick={() => {
            setAuthMethod("options");
            setErrors({});
            setErrorMsg("");
          }}
          variant="ghost"
          className="p-2 -ml-2 rounded-full text-text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-[28px] font-bold mx-auto text-text-primary">
          {t("signup")}
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

      <Form className="flex flex-col gap-4 flex-1" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          
          <Input
            label={t("username")}
            type="text"
            placeholder={t("username")}
            className="input-field"
            value={username}
            error={errors.username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
          />

          <Input
            label={t("email")}
            type="email"
            placeholder={t("email")}
            className="input-field"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
          />

          <Input
            label={t("password")}
            type="password"
            placeholder={t("password")}
            className="input-field"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[13px] font-bold text-text-muted uppercase tracking-wider ml-1 mb-1">
              {t("dob")}
            </label>
            <div className="flex gap-2">
              <Select
                value={dob.month}
                options={[
                  { value: "", label: t("Month") },
                  ...months.map((m) => ({ value: String(m), label: `${t("Month")} ${m}` })),
                ]}
                onChange={(val) => {
                  updateDob({ month: val });
                  if (errors.dob) {
                    setErrors((prev) => ({ ...prev, dob: undefined }));
                  }
                }}
                ariaLabel={t("Month")}
                className="flex-1 min-w-0"
              />
              <Select
                value={dob.day}
                options={[
                  { value: "", label: t("Day") },
                  ...days.map((d) => ({ value: String(d), label: String(d) })),
                ]}
                onChange={(val) => {
                  updateDob({ day: val });
                  if (errors.dob) {
                    setErrors((prev) => ({ ...prev, dob: undefined }));
                  }
                }}
                ariaLabel={t("Day")}
                className="flex-1 min-w-0"
              />
              <Select
                value={dob.year}
                options={[
                  { value: "", label: t("Year") },
                  ...years.map((y) => ({ value: String(y), label: String(y) })),
                ]}
                onChange={(val) => {
                  updateDob({ year: val });
                  if (errors.dob) {
                    setErrors((prev) => ({ ...prev, dob: undefined }));
                  }
                }}
                ariaLabel={t("Year")}
                className="flex-1 min-w-0"
              />
            </div>
            {errors.dob && (
              <p className="text-xs font-medium text-red-500 ml-1 mt-0.5 animate-in slide-in-from-top-1">
                {errors.dob}
              </p>
            )}
          </div>
        </div>

        <Button 
          type="submit"
          className="w-full mt-4"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t("signup")}
        </Button>
      </Form>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary px-4">
      <DocumentTitle title={`${t("signup")} | TopTop`} />
      <div className="w-full max-w-[480px] bg-background border border-elevated rounded-[12px] p-[24px] shadow-lg relative flex flex-col">
      

        <div className="flex-1 mt-6">
          {authMethod === "options" ? renderOptions() : renderForm()}
        </div>

        <div className="mt-8 pt-6 border-t border-elevated text-center">
          <p className="text-[12px] text-text-muted mb-6 leading-relaxed">
            {t("termsPrompt")}
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <span className="text-[15px] text-text-primary">
              {t("hasAccount")}
            </span>
            <Link 
              href="/login"
              className="text-brand font-bold text-[15px] hover:underline"
            >
              {t("login")}
            </Link>
          </div>
        </div>

      </div>
      {tempAuthData && (
        <AuthModal 
          onClose={() => setTempAuthData(null)}
          initialMethod="onboard_password"
          tempAuthData={tempAuthData}
        />
      )}
    </div>
  );
}