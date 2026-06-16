import { useState, useEffect } from "react";
import { User, ChevronLeft } from "lucide-react";
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

import { Button, Input, Modal, Select, Form } from "@repo/ui";
import type { UserInfo } from "@/types/user";
import OptionBtn from "./OptionButton";

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
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; dob?: string; confirmPassword?: string }>({});

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
    setErrors({});
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
    const newErrors: typeof errors = {};
    const { username, email, password } = formData;

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

    if (type === "signup") {
      const newErrors = validateSignup();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      registerMutation.mutate(formData, {
        onError: (err: Error) => setErrorMsg(err.message ?? t("errorAuth")),
      });
    } else {
      const input = formData.email.trim();
      const newErrors: typeof errors = {};

      if (!input) {
        newErrors.email = t("errEmailOrUsernameRequired");
      } else if (input.includes("@")) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          newErrors.email = t("errEmailPattern");
        }
      } else {
        if (input.length < 2 || input.length > 24) {
          newErrors.email = t("errUsernameLength");
        } else if (!/^[a-zA-Z0-9._]+$/.test(input)) {
          newErrors.email = t("errUsernamePattern");
        }
      }

      if (!formData.password) {
        newErrors.password = t("errPasswordRequired");
      } else if (formData.password.length < 8 || formData.password.length > 20) {
        newErrors.password = t("errPasswordLength");
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      loginMutation.mutate(
        { email: input, password: formData.password },
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

  const monthOptions = [
    { value: "", label: t("Month") },
    ...months.map((m) => ({ value: String(m), label: String(m) })),
  ];
  const dayOptions = [
    { value: "", label: t("Day") },
    ...days.map((d) => ({ value: String(d), label: String(d) })),
  ];
  const yearOptions = [
    { value: "", label: t("Year") },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];

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
                      <Select
                        value={dob.month}
                        options={monthOptions}
                        onChange={(val) => {
                          updateDob({ month: val });
                          if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                        }}
                        ariaLabel="Tháng sinh"
                        className="flex-1 min-w-0"
                      />
                      <Select
                        value={dob.day}
                        options={dayOptions}
                        onChange={(val) => {
                          updateDob({ day: val });
                          if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                        }}
                        ariaLabel="Ngày sinh"
                        className="flex-1 min-w-0"
                      />
                      <Select
                        value={dob.year}
                        options={yearOptions}
                        onChange={(val) => {
                          updateDob({ year: val });
                          if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                        }}
                        ariaLabel="Năm sinh"
                        className="flex-1 min-w-0"
                      />
                    </div>
                    {errors.dob && (
                      <p className="text-xs font-medium text-red-500 ml-1 mt-0.5 animate-in slide-in-from-top-1">
                        {errors.dob}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setErrors({});
                      setErrorMsg("");
                      if (!dob.month || !dob.day || !dob.year) {
                        setErrors({ dob: t("errSelectDob") });
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
                        setErrors({ dob: t("errInvalidDob") });
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
                        setErrors({ dob: t("errAgeRestriction") });
                        return;
                      }
                      if (birthDate > today) {
                        setErrors({ dob: t("errFutureDob") });
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
                    error={errors.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    autoComplete="new-password"
                  />
                  <Input
                    label={t("confirmPassword")}
                    type="password"
                    placeholder={t("confirmPassword")}
                    value={formData.confirmPassword}
                    error={errors.confirmPassword}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      });
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    autoComplete="new-password"
                  />
                  <Button
                    onClick={() => {
                      setErrors({});
                      setErrorMsg("");
                      setSuccessMsg("");

                      const newErrors: typeof errors = {};

                      if (
                        formData.password.length < 8 ||
                        formData.password.length > 20
                      ) {
                        newErrors.password = t("errPasswordLength");
                      } else if (
                        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/.test(
                          formData.password,
                        )
                      ) {
                        newErrors.password = t("errPasswordPattern");
                      }

                      if (formData.password !== formData.confirmPassword) {
                        newErrors.confirmPassword = t("errPasswordMismatch");
                      }

                      if (Object.keys(newErrors).length > 0) {
                        setErrors(newErrors);
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
                    error={errors.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                  />
                  <Button
                    onClick={async () => {
                      setErrors({});
                      setErrorMsg("");
                      setSuccessMsg("");
                      const username = formData.username.trim();

                      const newErrors: typeof errors = {};

                      if (username.length < 2 || username.length > 24) {
                        newErrors.username = t("errUsernameLength");
                      } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
                        newErrors.username = t("errUsernamePattern");
                      }

                      if (Object.keys(newErrors).length > 0) {
                        setErrors(newErrors);
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

                <Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  {type === "signup" && (
                    <>
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
                          {t("dob")}
                        </label>
                        <div className="flex gap-2">
                          <Select
                            value={dob.month}
                            options={monthOptions}
                            onChange={(val) => {
                              updateDob({ month: val });
                              if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                            }}
                            ariaLabel="Tháng sinh"
                            className="flex-1 min-w-0"
                          />
                          <Select
                            value={dob.day}
                            options={dayOptions}
                            onChange={(val) => {
                              updateDob({ day: val });
                              if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                            }}
                            ariaLabel="Ngày sinh"
                            className="flex-1 min-w-0"
                          />
                          <Select
                            value={dob.year}
                            options={yearOptions}
                            onChange={(val) => {
                              updateDob({ year: val });
                              if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                            }}
                            ariaLabel="Năm sinh"
                            className="flex-1 min-w-0"
                          />
                        </div>
                        {errors.dob && (
                          <p className="text-xs font-medium text-red-500 ml-1 mt-0.5 animate-in slide-in-from-top-1">
                            {errors.dob}
                          </p>
                        )}
                      </div>
                      <Input
                        label={t("username")}
                        placeholder={t("username")}
                        value={formData.username}
                        error={errors.username}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          });
                          if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                        }}
                      />
                    </>
                  )}
                  <Input
                    label={type === "login" ? `${t("email")}` : t("email")}
                    type={type === "login" ? "text" : "email"}
                    placeholder={type === "login" ? `${t("email")}` : t("email")}
                    value={formData.email}
                    error={errors.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                  />
                  <Input
                    label={t("password")}
                    type="password"
                    placeholder={t("password")}
                    value={formData.password}
                    error={errors.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
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
                </Form>
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

  