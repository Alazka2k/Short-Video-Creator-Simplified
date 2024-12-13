'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading';
import { FeatureSlideshow } from '@/components/auth/feature-slideshow';
import Link from 'next/link';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 lg:px-12 bg-background">
        <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            By continuing, you acknowledge our{' '}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex w-1/2 bg-black">
        <FeatureSlideshow />
      </div>
    </div>
  );
} 