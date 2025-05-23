/**
 * Prelaunch Layout Component
 * Needs to be overridden by the production marketing page layout
 * 
 * Root layout for the prelaunch marketing landing page.
 * Provides simplified structure focused on lead generation.
 * 
 * Features:
 * - Simplified header without navigation
 * - Only legal pages in footer
 * - Theme provider integration
 * - SEO optimization setup
 * 
 * Layout Elements:
 * - Prelaunch header (logo only)
 * - Main content area
 * - Prelaunch footer (legal links only)
 * - Theme handling
 * 
 * @component
 */

"use client";

import { PrelaunchFooter } from "@/components/marketing/prelaunch-footer";
import { PrelaunchHeader } from "@/components/layout/prelaunch-header";

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

      <PrelaunchHeader />
      <main className="flex-1">
        {children}
      </main>
      <PrelaunchFooter />
    </div>
  );
} 