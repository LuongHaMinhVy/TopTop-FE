"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Pencil, Loader2 } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useUpdateProfileMutation, useUploadAvatarMutation } from "@/hooks/user-hooks";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  
  const [usernameError, setUsernameError] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();

  // Reset fields when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen && currentUser) {
      Promise.resolve().then(() => {
        setUsername(currentUser.username || "");
        setNickname(currentUser.nickname || "");
        setBio(currentUser.bio || "");
        setAvatarUrl(currentUser.avatarUrl || "");
        setAvatarPreviewUrl("");
        setSelectedAvatarFile(null);
        setUsernameError("");
        setNicknameError("");
        setErrorMessage("");
        setSuccessMessage("");
      });
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  if (!isOpen || !currentUser) return null;

  // Handle avatar file selection. Upload happens only when saving the profile.
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client side check: size <= 10MB, type is image
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ảnh có dung lượng quá lớn (Tối đa 10MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Chỉ hỗ trợ tệp định dạng hình ảnh");
      return;
    }

    setErrorMessage("");
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    e.target.value = "";
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Validate username
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (!val.trim()) {
      setUsernameError("TikTok ID không được để trống");
    } else if (val.length < 2 || val.length > 24) {
      setUsernameError("TikTok ID phải có từ 2 đến 24 ký tự");
    } else if (!/^[a-zA-Z0-9._]+$/.test(val)) {
      setUsernameError("TikTok ID chỉ có thể bao gồm chữ cái, chữ số, dấu gạch dưới và dấu chấm");
    } else {
      setUsernameError("");
    }
  };

  // Validate nickname
  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (!val.trim()) {
      setNicknameError("Tên không được để trống");
    } else if (val.length > 30) {
      setNicknameError("Tên không được vượt quá 30 ký tự");
    } else {
      setNicknameError("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || nicknameError) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      let nextAvatarUrl = avatarUrl;
      if (selectedAvatarFile) {
        const uploadResponse = await uploadAvatarMutation.mutateAsync(selectedAvatarFile);
        nextAvatarUrl = uploadResponse.data || avatarUrl;
      }
      
      const response = await updateProfileMutation.mutateAsync({
        username,
        nickname,
        bio,
        avatarUrl: nextAvatarUrl,
      });

      setSuccessMessage("Cập nhật hồ sơ thành công!");
      // Briefly show success state, then close modal
      setTimeout(() => {
        onClose();
        if (response.data && response.data.username !== currentUser.username) {
          router.push(`/@${response.data.username}`);
        }
      }, 800);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Failed to update profile:", error);
      setErrorMessage(error?.response?.data?.message || "Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.");
    }
  };

  const isChanged = 
    username !== (currentUser.username || "") ||
    nickname !== (currentUser.nickname || "") ||
    bio !== (currentUser.bio || "") ||
    avatarUrl !== (currentUser.avatarUrl || "") ||
    selectedAvatarFile !== null;

  const isValid = username.trim() && nickname.trim() && !usernameError && !nicknameError;
  const isPending = updateProfileMutation.isPending || uploadAvatarMutation.isPending;
  const displayedAvatarUrl = avatarPreviewUrl || avatarUrl;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 transition-opacity duration-300">
      {/* Modal Container */}
      <div className="w-full max-w-[700px] overflow-hidden rounded-xl bg-[#121212] border border-white/10 text-white shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <h2 className="text-xl font-bold">Sửa hồ sơ</h2>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isPending}
            className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          
          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm font-medium text-green-400">
              {successMessage}
            </div>
          )}

          {/* Row 1: Ảnh hồ sơ */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-4 pb-6 border-b border-white/10">
            <span className="text-[15px] font-bold text-white/90 pt-8">Ảnh hồ sơ</span>
            <div className="flex justify-center sm:justify-start">
              <div 
                onClick={isPending ? undefined : triggerFileSelect}
                className="relative group h-[96px] w-[96px] cursor-pointer overflow-hidden rounded-full border border-white/20 transition-all hover:brightness-90"
              >
                {displayedAvatarUrl ? (
                  <Image 
                    src={displayedAvatarUrl} 
                    alt="Avatar" 
                    fill 
                    sizes="96px"
                    unoptimized={displayedAvatarUrl.startsWith("blob:")}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold rounded-full">
                    {nickname ? nickname[0].toUpperCase() : username ? username[0].toUpperCase() : "U"}
                  </div>
                )}
                
                {/* Overlay pencil icon */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                
                {uploadAvatarMutation.isPending && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 text-brand animate-spin" />
                  </div>
                )}
                
                {/* Pencil icon badge at bottom right as shown in screenshot */}
                <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-[#333] border border-white/20 flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-white/80" />
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Row 2: TikTok ID */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-4 pb-6 border-b border-white/10">
            <span className="text-[15px] font-bold text-white/90 pt-2">TikTok ID</span>
            <div className="space-y-2">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="TikTok ID"
                disabled={isPending}
                className={`w-full max-w-[460px] rounded-md bg-[#2f2f2f] px-3 py-2 text-sm text-white border transition focus:outline-none focus:ring-1 focus:ring-brand
                  ${usernameError ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:border-white/30"}
                `}
              />
              
              <div className="text-[12px] font-medium text-white/50 break-all select-none">
                www.tiktok.com/@{username || "username"}
              </div>

              {usernameError ? (
                <p className="text-xs font-medium text-red-400">{usernameError}</p>
              ) : (
                <p className="text-[12px] leading-relaxed text-white/50 max-w-[460px]">
                  TikTok ID chỉ có thể bao gồm chữ cái, chữ số, dấu gạch dưới và dấu chấm. Khi thay đổi TikTok ID, liên kết hồ sơ của bạn cũng sẽ thay đổi.
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Tên */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-4 pb-6 border-b border-white/10">
            <span className="text-[15px] font-bold text-white/90 pt-2">Tên</span>
            <div className="space-y-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Tên"
                maxLength={30}
                disabled={isPending}
                className={`w-full max-w-[460px] rounded-md bg-[#2f2f2f] px-3 py-2 text-sm text-white border transition focus:outline-none focus:ring-1 focus:ring-brand
                  ${nicknameError ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:border-white/30"}
                `}
              />

              {nicknameError ? (
                <p className="text-xs font-medium text-red-400">{nicknameError}</p>
              ) : (
                <p className="text-[12px] leading-relaxed text-white/50 max-w-[460px]">
                  Bạn chỉ có thể thay đổi biệt danh 7 ngày một lần.
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Tiểu sử */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-4 pb-4">
            <span className="text-[15px] font-bold text-white/90 pt-2">Tiểu sử</span>
            <div className="space-y-2 relative max-w-[460px]">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 80))}
                placeholder="Tiểu sử"
                maxLength={80}
                disabled={isPending}
                rows={3}
                className="w-full rounded-md bg-[#2f2f2f] border border-white/10 px-3 py-2 text-sm text-white transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              
              <div className="text-xs text-white/40 text-right">
                {bio.length}/80
              </div>
            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="flex h-20 shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-[#121212] px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-10 rounded px-6 text-[15px] font-bold bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white transition duration-200 disabled:opacity-50"
          >
            Hủy
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={!isChanged || !isValid || isPending}
            className={`h-10 rounded px-8 text-[15px] font-bold transition duration-200 flex items-center justify-center min-w-[96px]
              ${(!isChanged || !isValid || isPending)
                ? "bg-[#333333] text-white/30 cursor-not-allowed" 
                : "bg-brand hover:bg-brand/90 text-white active:scale-95"
              }
            `}
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Lưu"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
