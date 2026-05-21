"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setNotFound } from "@/store/slices/authSlice";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui";

export default function RootNotFound() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setNotFound(true));
    return () => {
      dispatch(setNotFound(false));
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center is-not-found-page">
      <div className="relative mb-8">
        <h1 className="text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-elevated animate-pulse">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className="text-4xl sm:text-6xl font-black italic tracking-tighter text-text-primary absolute z-10 select-none">t</span>
            <span className="text-4xl sm:text-6xl font-black italic tracking-tighter text-[#25F4EE] absolute z-0 select-none animate-bounce" style={{ transform: 'translate(-3px, -3px)' }}>t</span>
            <span className="text-4xl sm:text-6xl font-black italic tracking-tighter text-[#FE2C55] absolute z-0 select-none animate-bounce-slow" style={{ transform: 'translate(3px, 3px)' }}>t</span>
          </div>
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
          Page Not Found
        </h2>
        <p className="text-text-secondary font-medium leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-sm sm:max-w-none justify-center">
        <Link href={"/"} className="cursor-pointer">
        <Button 
          variant="outline" 
          size="xl" 
          className="rounded-2xl"
          leftIcon={<ArrowLeft size={20} />}
          >
          Go Back
        </Button>
          </Link>
        <Link href={"/"} className="cursor-pointer">
        <Button 
          variant="primary" 
          size="xl" 
          className="rounded-2xl shadow-xl shadow-brand/20"
          leftIcon={<Home size={20} />}
        >
          Go Home
        </Button>
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#25F4EE]/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>
    </div>
  );
}
