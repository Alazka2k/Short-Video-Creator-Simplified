"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if we're in dark mode
  const isDarkMode = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background image with overlay - conditionally rendered based on theme */}
      <div className="fixed inset-0 -z-10">
        {isDarkMode ? (
          <>
            <Image
              src="/reset-password/reset-dark.png"
              alt="Dark Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/80 to-black/95 backdrop-blur-[1px]" />
          </>
        ) : (
          <>
            <Image
              src="/reset-password/reset-white.png"
              alt="Light Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/95 backdrop-blur-[1px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.08)_0%,transparent_60%)]" />
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <main className="w-full max-w-[480px] px-4">
        <ResetPasswordForm token={token || undefined} />
      </main>

      {/* Decorative elements - theme responsive */}
      <div className="fixed inset-0 pointer-events-none">
        {isDarkMode ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.08)_0%,transparent_65%)]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_65%)]" />
        )}
      </div>
    </div>
  );
} 