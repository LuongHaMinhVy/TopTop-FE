import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { User, ChevronLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Facebook from "@/components/shared/icons/FaceBookIcon";
import Google from "@/components/shared/icons/GoogleIcon";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  useLoginMutation,
  useRegisterMutation,
  useOAuth,
  useOAuth2OnboardMutation,
} from "@/hooks/auth-hooks";
import type {
  AuthType,
  AuthMethod,
  AuthModalProps,
  AuthMessageData,
  AuthResponse,
} from "@/types/auth";
import { AccountReactivationDialog } from "@/components/auth/AccountReactivationDialog";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Modal } from "@repo/ui/modal";
import type { UserInfo } from "@/types/user";

const OAUTH_ONBOARD_DRAFT_KEY = "toptop.oauth2OnboardDraft";
const OAUTH_ONBOARD_STEPS: AuthMethod[] = [
  "onboard_password",
  "onboard_dob",
  "onboard_username",
];

type OAuthOnboardDraft = {
  method?: AuthMethod;
  username?: string;
  dateOfBirth?: string;
  dob?: {
    month: string;
    day: string;
    year: string;
  };
};

const getAuthUser = (authData?: AuthResponse | UserInfo | null) => {
  if (!authData) return null;
  return "user" in authData ? authData.user : authData;
};

const isOAuthOnboardStep = (value: AuthMethod) =>
  OAUTH_ONBOARD_STEPS.includes(value);

const readOAuthOnboardDraft = (): OAuthOnboardDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const rawDraft = window.sessionStorage.getItem(OAUTH_ONBOARD_DRAFT_KEY);
    return rawDraft ? (JSON.parse(rawDraft) as OAuthOnboardDraft) : null;
  } catch {
    return null;
  }
};

const saveOAuthOnboardDraft = (draft: OAuthOnboardDraft) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OAUTH_ONBOARD_DRAFT_KEY, JSON.stringify(draft));
};

const clearOAuthOnboardDraft = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(OAUTH_ONBOARD_DRAFT_KEY);
};

export default function AuthModal({
  onClose,
  initialType = "login",
  initialMethod = "options",
  tempAuthData: propTempAuthData = undefined,
}: Omit<AuthModalProps, "isOpen">) {
  const t = useTranslations("auth");
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [type, setType] = useState<AuthType>(initialType);
  const [method, setMethod] = useState<AuthMethod>(initialMethod);
  const [tempAuthData, setTempAuthData] = useState<AuthResponse | null>(
    propTempAuthData ?? null,
  );
  const [reactivationAuthData, setReactivationAuthData] =
    useState<AuthResponse | null>(null);

  const [formData, setFormData] = useState(() => {
    const user = getAuthUser(propTempAuthData);

    const shouldRestoreDraft =
      propTempAuthData && isOAuthOnboardStep(initialMethod);

    const draft =
      typeof window !== "undefined" && shouldRestoreDraft
        ? readOAuthOnboardDraft()
        : null;

    return {
      email: "",
      password: "",
      confirmPassword: "",
      username: draft?.username ?? user?.username ?? "",
      dateOfBirth: draft?.dateOfBirth ?? "",
    };
  });

  const [dob, setDob] = useState(() => {
    const shouldRestoreDraft =
      propTempAuthData && isOAuthOnboardStep(initialMethod);

    const draft =
      typeof window !== "undefined" && shouldRestoreDraft
        ? readOAuthOnboardDraft()
        : null;

    return (
      draft?.dob ?? {
        month: "",
        day: "",
        year: "",
      }
    );
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const onboardMutation = useOAuth2OnboardMutation(() => {
    clearOAuthOnboardDraft();
    setSuccessMsg(t("successLogin"));
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1000);
  });

  useEffect(() => {
    const channel = new BroadcastChannel("oauth_channel");

    channel.onmessage = (event) => {
      const authEvent = event.data as AuthMessageData;
      if (authEvent.type === "AUTH_SUCCESS") {
        const { data } = authEvent;
        const responseData = data as AuthResponse;
        if (responseData.reactivationRequired) {
          setReactivationAuthData(responseData);
          return;
        }
        const user = getAuthUser(responseData);
        if (user && user.onboarded === false) {
          const draft = readOAuthOnboardDraft();
          setTempAuthData(responseData);
          setFormData((prev) => ({
            ...prev,
            username: draft?.username ?? user.username ?? prev.username,
            dateOfBirth: draft?.dateOfBirth ?? prev.dateOfBirth,
            password: "",
            confirmPassword: "",
          }));
          if (draft?.dob) {
            setDob(draft.dob);
          }
          setMethod("onboard_password");
          if (draft?.method && draft.method !== "onboard_password") {
            setErrorMsg(t("errPasswordNotSaved"));
          }
          return;
        }

        setSuccessMsg(t("successLogin"));
        if (data) {
          dispatch(setCredentials(data));
          const authUser = getAuthUser(data);
          if (authUser) {
            queryClient.setQueryData(["currentUser"], { data: authUser });
          }
        }
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }, 300);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else if (authEvent.type === "AUTH_ERROR") {
        setErrorMsg(authEvent.error ?? t("errorAuth"));
      }
    };

    return () => channel.close();
  }, [dispatch, onClose, router, queryClient, t]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      dateOfBirth: "",
    });
    setDob({ month: "", day: "", year: "" });
    setErrorMsg("");
    setSuccessMsg("");
    setTempAuthData(null);
    clearOAuthOnboardDraft();
  };

  const { openAuthPopup } = useOAuth();
  const loginMutation = useLoginMutation((response) => {
    if (response.data?.reactivationRequired) {
      setReactivationAuthData(response.data);
      return;
    }
    setSuccessMsg(t("successLogin"));
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1000);
  });

  const registerMutation = useRegisterMutation(() => {
    setSuccessMsg(t("successRegister"));
    setTimeout(() => {
      setType("login");
      setMethod("form");
    }, 1500);
  });

  const handleOAuth = (provider: "google" | "facebook") => {
    openAuthPopup(provider);
  };

  const handleClose = () => {
    if (isOAuthOnboardStep(method)) {
      const shouldClose = window.confirm(t("confirmLeaveOnboarding"));
      if (!shouldClose) return;
    }
    onClose();
  };

  const validateSignup = () => {
    const { username, email, password } = formData;
    if (username.length < 2 || username.length > 24)
      return t("username") + " phải từ 2-24 ký tự.";
    if (!/^[a-zA-Z0-9._]+$/.test(username))
      return t("username") + " chứa ký tự không hợp lệ.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Định dạng " + t("email") + " không hợp lệ.";
    if (password.length < 8) return t("password") + " phải có ít nhất 8 ký tự.";

    if (!dob.month || !dob.day || !dob.year) {
      return "Vui lòng chọn ngày sinh.";
    }

    const yearNum = Number(dob.year);
    const monthNum = Number(dob.month);
    const dayNum = Number(dob.day);
    const today = new Date();
    const birthDate = new Date(yearNum, monthNum - 1, dayNum);

    if (
      birthDate.getFullYear() !== yearNum ||
      birthDate.getMonth() !== monthNum - 1 ||
      birthDate.getDate() !== dayNum
    ) {
      return "Ngày sinh không hợp lệ.";
    }

    let age = today.getFullYear() - yearNum;
    const monthDiff = today.getMonth() - (monthNum - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dayNum)) {
      age--;
    }
    if (age < 13) return "Bạn phải từ 13 tuổi trở lên để đăng ký.";
    if (birthDate > today) return "Ngày sinh không thể ở tương lai.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (type === "signup") {
      const err = validateSignup();
      if (err) return setErrorMsg(err);
      registerMutation.mutate(formData, {
        onError: (err: Error) => setErrorMsg(err.message ?? t("errorAuth")),
      });
    } else {
      loginMutation.mutate(
        { email: formData.email, password: formData.password },
        {
          onError: (err: Error) => setErrorMsg(err.message ?? t("errorAuth")),
        },
      );
    }
  };

  const updateDob = (updates: Partial<typeof dob>) => {
    const newDob = { ...dob, ...updates };
    setDob(newDob);
    if (newDob.month && newDob.day && newDob.year) {
      const month = newDob.month.padStart(2, "0");
      const day = newDob.day.padStart(2, "0");
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: `${newDob.year}-${month}-${day}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const handleReactivationActivated = () => {
    setReactivationAuthData(null);
    setSuccessMsg(t("reactivation.activated"));
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 700);
  };

  const handleReactivationCancelled = () => {
    setReactivationAuthData(null);
    setErrorMsg(t("reactivation.cancelled"));
  };

  const years = Array.from(
    { length: 121 },
    (_, i) => new Date().getFullYear() - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    if (!tempAuthData || !isOAuthOnboardStep(method)) return;
    saveOAuthOnboardDraft({
      method,
      username: formData.username,
      dateOfBirth: formData.dateOfBirth,
      dob,
    });
  }, [dob, formData.dateOfBirth, formData.username, method, tempAuthData]);

  const alertBanner = (msg: string, isError: boolean) => (
    <div
      className={`p-4 rounded-2xl mb-6 text-sm font-medium border animate-in slide-in-from-top-2 ${
        isError
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400"
      }`}
    >
      {msg}
    </div>
  );

  return (
    <>
      <Modal
        isOpen={true}
        onClose={handleClose}
        className="p-4"
        title={
          method === "options"
            ? type === "login"
              ? t("loginTo")
              : t("signupTo")
            : undefined
        }
      >
        <div className="flex flex-col h-full">
          <div className="flex-1">
            {method === "options" ? (
              <div className="flex flex-col gap-4 mt-2">
                <OptionBtn
                  icon={<User size={20} />}
                  text={t("useEmail")}
                  onClick={() => setMethod("form")}
                />
                <OptionBtn
                  icon={<Google size={20} />}
                  text={t("continueWithGoogle")}
                  onClick={() => handleOAuth("google")}
                />
                <OptionBtn
                  icon={<Facebook size={20} />}
                  text={t("continueWithFacebook")}
                  onClick={() => handleOAuth("facebook")}
                />
              </div>
            ) : method === "onboard_dob" ? (
              <div className="flex flex-col">
                <div className="flex items-center mb-8">
                  <h2 className="text-2xl font-bold mx-auto text-text-primary">
                    {t("chooseDob")}
                  </h2>
                </div>

                {(errorMsg || successMsg) &&
                  alertBanner(errorMsg || successMsg, !!errorMsg)}

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
                      {t("dobLabel")}
                    </label>
                    <div className="flex gap-2">
                      <CustomDropdown
                        value={dob.month}
                        options={months}
                        placeholder={t("Month")}
                        onChange={(val) => updateDob({ month: val })}
                      />
                      <CustomDropdown
                        value={dob.day}
                        options={days}
                        placeholder={t("Day")}
                        onChange={(val) => updateDob({ day: val })}
                      />
                      <CustomDropdown
                        value={dob.year}
                        options={years}
                        placeholder={t("Year")}
                        onChange={(val) => updateDob({ year: val })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setErrorMsg("");
                      if (!dob.month || !dob.day || !dob.year) {
                        setErrorMsg(t("errSelectDob"));
                        return;
                      }
                      const yearNum = Number(dob.year);
                      const monthNum = Number(dob.month);
                      const dayNum = Number(dob.day);
                      const today = new Date();
                      const birthDate = new Date(yearNum, monthNum - 1, dayNum);
                      if (
                        birthDate.getFullYear() !== yearNum ||
                        birthDate.getMonth() !== monthNum - 1 ||
                        birthDate.getDate() !== dayNum
                      ) {
                        setErrorMsg(t("errInvalidDob"));
                        return;
                      }
                      let age = today.getFullYear() - yearNum;
                      const monthDiff = today.getMonth() - (monthNum - 1);
                      if (
                        monthDiff < 0 ||
                        (monthDiff === 0 && today.getDate() < dayNum)
                      ) {
                        age--;
                      }
                      if (age < 13) {
                        setErrorMsg(t("errAgeRestriction"));
                        return;
                      }
                      if (birthDate > today) {
                        setErrorMsg(t("errFutureDob"));
                        return;
                      }
                      setMethod("onboard_username");
                    }}
                    size="xl"
                    className="mt-4"
                  >
                    {t("btnContinue")}
                  </Button>
                </div>
              </div>
            ) : method === "onboard_password" ? (
              <div className="flex flex-col">
                <div className="flex items-center mb-8">
                  <h2 className="text-2xl font-bold mx-auto text-text-primary">
                    {t("choosePassword")}
                  </h2>
                </div>

                {(errorMsg || successMsg) &&
                  alertBanner(errorMsg || successMsg, !!errorMsg)}

                <div className="flex flex-col gap-6">
                  <Input
                    label={t("password")}
                    type="password"
                    placeholder={t("password")}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    autoComplete="new-password"
                  />
                  <Input
                    label={t("confirmPassword")}
                    type="password"
                    placeholder={t("confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    autoComplete="new-password"
                  />
                  <Button
                    onClick={() => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      if (
                        formData.password.length < 8 ||
                        formData.password.length > 20
                      ) {
                        setErrorMsg(t("errPasswordLength"));
                        return;
                      }
                      if (
                        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/.test(
                          formData.password,
                        )
                      ) {
                        setErrorMsg(t("errPasswordPattern"));
                        return;
                      }
                      if (formData.password !== formData.confirmPassword) {
                        setErrorMsg(t("errPasswordMismatch"));
                        return;
                      }
                      setMethod("onboard_dob");
                    }}
                    size="xl"
                    className="mt-4"
                  >
                    {t("btnContinue")}
                  </Button>
                </div>
              </div>
            ) : method === "onboard_username" ? (
              <div className="flex flex-col">
                <div className="flex items-center mb-8">
                  <h2 className="text-2xl font-bold mx-auto text-text-primary">
                    {t("chooseUsername")}
                  </h2>
                </div>

                {(errorMsg || successMsg) &&
                  alertBanner(errorMsg || successMsg, !!errorMsg)}

                <div className="flex flex-col gap-6">
                  <Input
                    label={t("username")}
                    placeholder={t("username")}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                  <Button
                    onClick={async () => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      const username = formData.username.trim();
                      if (username.length < 2 || username.length > 24) {
                        setErrorMsg(t("username") + " phải từ 2-24 ký tự.");
                        return;
                      }
                      if (!/^[a-zA-Z0-9._]+$/.test(username)) {
                        setErrorMsg(
                          t("username") + " chứa ký tự không hợp lệ.",
                        );
                        return;
                      }
                      onboardMutation.mutate(
                        {
                          payload: {
                            username,
                            dateOfBirth: formData.dateOfBirth,
                            password: formData.password,
                          },
                          accessToken: tempAuthData?.accessToken,
                        },
                        {
                          onError: (err: unknown) => {
                            const error = err as {
                              response?: {
                                status?: number;
                                data?: { message?: string };
                              };
                              message?: string;
                            };
                            if (error.response?.status === 401) {
                              setTempAuthData(null);
                              setFormData((prev) => ({
                                ...prev,
                                password: "",
                                confirmPassword: "",
                              }));
                              setMethod("options");
                              setErrorMsg(t("errOAuthExpired"));
                              return;
                            }
                            if (!error.response) {
                              setErrorMsg(t("errNetwork"));
                              return;
                            }
                            setErrorMsg(
                              error.response.data?.message ??
                                error.message ??
                                t("errGeneric"),
                            );
                          },
                        },
                      );
                    }}
                    size="xl"
                    isLoading={onboardMutation.isPending}
                    className="mt-4"
                  >
                    {t("btnFinishRegister")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center mb-8">
                  <button
                    onClick={() => setMethod("options")}
                    className="p-2 -ml-2 rounded-full hover:bg-hover text-text-primary transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-bold mx-auto text-text-primary">
                    {type === "login" ? t("login") : t("signup")}
                  </h2>
                  <div className="w-10" />
                </div>

                {(errorMsg || successMsg) &&
                  alertBanner(errorMsg || successMsg, !!errorMsg)}

                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  {type === "signup" && (
                    <>
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
                          {t("dob")}
                        </label>
                        <div className="flex gap-2">
                          <CustomDropdown
                            value={dob.month}
                            options={months}
                            placeholder={t("Month")}
                            onChange={(val) => updateDob({ month: val })}
                          />
                          <CustomDropdown
                            value={dob.day}
                            options={days}
                            placeholder={t("Day")}
                            onChange={(val) => updateDob({ day: val })}
                          />
                          <CustomDropdown
                            value={dob.year}
                            options={years}
                            placeholder={t("Year")}
                            onChange={(val) => updateDob({ year: val })}
                          />
                        </div>
                      </div>
                      <Input
                        label={t("username")}
                        placeholder={t("username")}
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                      />
                    </>
                  )}
                  <Input
                    label={t("email")}
                    type="email"
                    placeholder={t("email")}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <Input
                    label={t("password")}
                    type="password"
                    placeholder={t("password")}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />

                  {type === "login" && (
                    <button
                      type="button"
                      className="text-xs font-bold text-text-muted hover:text-brand transition-colors text-left ml-1"
                    >
                      {t("forgotPassword")}
                    </button>
                  )}

                  <Button
                    type="submit"
                    size="xl"
                    isLoading={
                      loginMutation.isPending || registerMutation.isPending
                    }
                    className="mt-4"
                  >
                    {type === "login" ? t("login") : t("signup")}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {method !== "onboard_dob" &&
            method !== "onboard_password" &&
            method !== "onboard_username" && (
              <div className="mt-10 pt-8 border-t border-elevated flex flex-col items-center gap-6">
                <p className="text-[11px] text-text-muted text-center leading-relaxed max-w-[320px]">
                  {t("termsPrompt")}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">
                    {type === "login" ? t("noAccount") : t("hasAccount")}
                  </span>
                  <button
                    onClick={() => {
                      setType(type === "login" ? "signup" : "login");
                      setMethod("options");
                      resetForm();
                    }}
                    className="text-brand font-bold hover:underline transition-all"
                  >
                    {type === "login" ? t("signup") : t("login")}
                  </button>
                </div>
              </div>
            )}
        </div>
      </Modal>

      {reactivationAuthData && (
        <AccountReactivationDialog
          authData={reactivationAuthData}
          onActivated={handleReactivationActivated}
          onCancelled={handleReactivationCancelled}
        />
      )}
    </>
  );
}

// ─── CustomDropdown ──────────────────────────────────────────────────────────

function CustomDropdown({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: (number | string)[];
  placeholder: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] =
    useState<React.CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stable callback — no lint warning about missing deps
  const updateDropdownPosition = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    const maxHeight = Math.min(
      240,
      window.innerHeight - rect.bottom - gap - 12,
    );
    setDropdownStyle({
      left: rect.left,
      top: rect.bottom + gap,
      width: rect.width,
      maxHeight: Math.max(160, maxHeight),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // Portal target — only access document on the client (safe because portal
  // only renders when isOpen is true, which only happens after hydration).
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-4 bg-surface border border-elevated rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:border-brand text-text-primary flex items-center justify-between transition-all duration-200"
      >
        <span
          className={`text-[15px] font-medium ${
            !value ? "text-text-muted" : "text-text-primary"
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        dropdownStyle &&
        portalTarget &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            role="listbox"
            data-select-menu
            className="select-options-solid fixed z-[10000] overflow-y-auto bg-background border border-elevated rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2 custom-scrollbar animate-in zoom-in fade-in duration-200"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(String(opt));
                  setIsOpen(false);
                }}
                className={`w-full px-6 py-3 text-left hover:bg-hover transition-colors text-[15px] font-medium ${
                  String(opt) === value
                    ? "text-brand bg-brand/5"
                    : "text-text-primary"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </div>
  );
}

// ─── OptionBtn ───────────────────────────────────────────────────────────────

function OptionBtn({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-6 py-4 border border-elevated rounded-2xl hover:bg-hover bg-background transition-all duration-200 group active:scale-[0.98]"
    >
      <div className="text-text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="flex-1 text-center font-bold text-sm text-text-primary">
        {text}
      </span>
    </button>
  );
}
