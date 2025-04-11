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

import { MarketingFooter } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient blob */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        
        {/* Accent blobs */}
        <div className="absolute -top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
} 