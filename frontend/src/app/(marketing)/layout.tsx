/**
 * Marketing Layout Component
 * 
 * Root layout for all marketing-related pages (landing page, features, pricing, etc.).
 * Provides consistent structure and styling for public-facing pages.
 * 
 * Features:
 * - Common header and footer
 * - Theme provider integration
 * - SEO optimization setup
 * - Analytics integration (when implemented)
 * - Responsive layout structure
 * 
 * Layout Elements:
 * - Marketing header with navigation
 * - Main content area
 * - Marketing footer with links
 * - Theme handling
 * 
 * Responsibilities:
 * - Marketing pages structure
 * - Theme context provision
 * - Analytics tracking
 * - SEO metadata
 * 
 * @component
 * @example
 * ```tsx
 * <MarketingLayout>
 *   <LandingPage />
 * </MarketingLayout>
 * ```
 */

"use client";

import { Suspense, useEffect } from "react";
import { MarketingFooter } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Background } from "@/components/layout/background";

// Loading fallback component
function LoadingFallback() {
  return <div className="min-h-screen bg-background" />;
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log('Marketing layout mounted', {
      timestamp: new Date().toISOString(),
      pathname: window.location.pathname
    });
  }, []);

  return (
    <>
      <Background showOverlays />
      <div className="relative min-h-screen flex flex-col">
        <Suspense fallback={<LoadingFallback />}>
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
          <MarketingFooter />
        </Suspense>
      </div>
    </>
  );
} 