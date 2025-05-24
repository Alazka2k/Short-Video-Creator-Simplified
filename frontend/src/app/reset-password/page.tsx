"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Image from "next/image";

// Import route configuration directly from the main config
export { dynamic, fetchCache, revalidate } from '@/lib/config';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background image with overlay */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/reset-password/reset.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/80 to-black/95 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <main className="w-full max-w-[480px] px-4">
        <ResetPasswordForm token={token || undefined} />
      </main>

      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.08)_0%,transparent_65%)]" />
      </div>
    </div>
  );
} 