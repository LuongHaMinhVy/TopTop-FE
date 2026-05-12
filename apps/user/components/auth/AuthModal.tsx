"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Facebook from "@/components/shared/icons/FaceBookIcon";
import Google from "@/components/shared/icons/GoogleIcon";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLoginMutation, useRegisterMutation, useOAuth } from "@/hooks/auth-hooks";
import type { AuthType, AuthMethod, AuthModalProps, AuthMessageData } from "@/types/auth";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Modal } from "@repo/ui/modal";

export default function AuthModal({ onClose, initialType = "login" }: Omit<AuthModalProps, 'isOpen'>) {
  const t = useTranslations('auth');
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [type, setType] = useState<AuthType>(initialType);
  const [method, setMethod] = useState<AuthMethod>("options");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    dateOfBirth: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const authEvent = event.data as AuthMessageData;
      if (authEvent.type === "AUTH_SUCCESS") {
        const { data } = authEvent;
        setSuccessMsg(t('successLogin'));
        if (data) dispatch(setCredentials(data));
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }, 300);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1000);
      } else if (event.data?.type === "AUTH_ERROR") {
        setErrorMsg(event.data.error || t('errorAuth'));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch, onClose, router, queryClient, t]);

  const resetForm = () => {
    setFormData({ email: "", password: "", username: "", dateOfBirth: "" });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const { openAuthPopup } = useOAuth();
  const loginMutation = useLoginMutation(() => {
    setSuccessMsg(t('successLogin'));
    setTimeout(() => { onClose(); router.refresh(); }, 1000);
  });

  const registerMutation = useRegisterMutation(() => {
    setSuccessMsg(t('successRegister'));
    setTimeout(() => { setType("login"); setMethod("form"); }, 1500);
  });

  const handleOAuth = (provider: 'google' | 'facebook') => {
    openAuthPopup(provider);
  };

  const validateSignup = () => {
    const { username, email, password, dateOfBirth } = formData;
    if (username.length < 2 || username.length > 24) return t('username') + " phải từ 2-24 ký tự."; // Ideally these would be separate keys
    if (!/^[a-zA-Z0-9._]+$/.test(username)) return t('username') + " chứa ký tự không hợp lệ.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Định dạng " + t('email') + " không hợp lệ.";
    if (password.length < 8) return t('password') + " phải có ít nhất 8 ký tự.";
    if (!dateOfBirth) return "Vui lòng nhập " + t('dob').toLowerCase() + ".";
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
        onError: (err: Error) => setErrorMsg(err.message || t('errorAuth'))
      });
    } else {
      loginMutation.mutate({ email: formData.email, password: formData.password }, {
        onError: (err: Error) => setErrorMsg(err.message || t('errorAuth'))
      });
    }
  };

  return (
    <Modal
      isOpen={true} 
      onClose={onClose}
      title={method === "options" ? (type === "login" ? t('loginTo') : t('signupTo')) : undefined}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          {method === "options" ? (
            <div className="flex flex-col gap-4 mt-2">
              <OptionBtn icon={<User size={20} />} text={t('useEmail')} onClick={() => setMethod("form")} />
              <OptionBtn icon={<Google size={20} />} text={t('continueWithGoogle')} onClick={() => handleOAuth('google')} />
              <OptionBtn icon={<Facebook size={20} />} text={t('continueWithFacebook')} onClick={() => handleOAuth('facebook')} />
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
                  {type === "login" ? t('login') : t('signup')}
                </h2>
                <div className="w-10" />
              </div>

              {(errorMsg || successMsg) && (
                <div className={`p-4 rounded-2xl mb-6 text-sm font-medium border animate-in slide-in-from-top-2 ${errorMsg ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400"}`}>
                  {errorMsg || successMsg}
                </div>
              )}

              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {type === "signup" && (
                  <>
                    <Input 
                      label={t('username')} 
                      placeholder={t('username')} 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                    <Input 
                      label={t('dob')} 
                      type="date" 
                      value={formData.dateOfBirth} 
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} 
                    />
                  </>
                )}
                <Input 
                  label={t('email')} 
                  type="email" 
                  placeholder={t('email')} 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
                <Input 
                  label={t('password')} 
                  type="password" 
                  placeholder={t('password')} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                
                {type === "login" && (
                  <button type="button" className="text-xs font-bold text-text-muted hover:text-brand transition-colors text-left ml-1">
                    {t('forgotPassword')}
                  </button>
                )}
                
                <Button 
                  type="submit" 
                  size="xl"
                  isLoading={loginMutation.isPending || registerMutation.isPending}
                  className="mt-4"
                >
                  {type === "login" ? t('login') : t('signup')}
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-elevated flex flex-col items-center gap-6">
          <p className="text-[11px] text-text-muted text-center leading-relaxed max-w-[320px]">
            {t('termsPrompt')}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">
              {type === "login" ? t('noAccount') : t('hasAccount')}
            </span>
            <button 
              onClick={() => { setType(type === "login" ? "signup" : "login"); setMethod("options"); resetForm(); }} 
              className="text-brand font-bold hover:underline transition-all"
            >
              {type === "login" ? t('signup') : t('login')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function OptionBtn({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center w-full px-6 py-4 border border-elevated rounded-2xl hover:bg-hover bg-background transition-all duration-200 group active:scale-[0.98]"
    >
      <div className="text-text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <span className="flex-1 text-center font-bold text-sm text-text-primary">{text}</span>
    </button>
  );
}
