"use client";

import React from "react";
import Facebook from "@/components/shared/icons/FaceBookIcon";
import Google from "@/components/shared/icons/GoogleIcon";
import { useOAuth } from "@/hooks/auth-hooks";

interface SocialLoginButtonsProps {
  className?: string;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ className }) => {
  const { openAuthPopup } = useOAuth();

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <button
        onClick={() => openAuthPopup("google")}
        className="flex items-center w-full p-3.5 border border-elevated rounded-[4px] bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
      >
        <Google className="w-5 h-5 ml-1" />
        <span className="flex-1 text-center font-bold text-[15px] text-[#3c4043]">Tiếp tục với Google</span>
      </button>

      <button
        onClick={() => openAuthPopup("facebook")}
        className="flex items-center w-full p-3.5 border border-transparent rounded-[4px] bg-[#1877F2] hover:bg-[#166fe5] transition-all duration-200 shadow-sm text-white"
      >
        <Facebook className="w-5 h-5 ml-1" fill="white" />
        <span className="flex-1 text-center font-bold text-[15px]">Tiếp tục với Facebook</span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
