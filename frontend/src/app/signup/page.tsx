'use client';

import { SignupForm } from "@/components/auth/signup-form";
import { FeatureSlideshow } from "@/components/auth/feature-slideshow";
import Image from 'next/image';

export default function SignupPage() {
  return (
    <main className="grid lg:grid-cols-2 min-h-screen relative">
      <div className="absolute inset-0 w-full h-full -z-10">
        <Image
          src="/signup/signup.png"
          alt="Signup background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/80" />
      </div>
      <SignupForm />
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent" />
        <FeatureSlideshow />
      </div>
    </main>
  );
} 