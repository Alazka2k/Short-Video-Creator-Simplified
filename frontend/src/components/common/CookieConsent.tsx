"use client";

import { useState, useEffect } from "react";
import CookieConsentLib from "react-cookie-consent";
import Link from "next/link";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface CookieConsentProps {
  acceptAnalytics?: () => void;
  declineAnalytics?: () => void;
}

export function CookieConsent({ acceptAnalytics, declineAnalytics }: CookieConsentProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine if we're in dark mode
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <CookieConsentLib
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Accept Only Essential"
      cookieName="videocreator-cookie-consent"
      style={{
        background: isDarkMode ? "hsl(240 10% 3.9% / 0.95)" : "hsl(0 0% 100% / 0.98)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
        borderTop: isDarkMode 
          ? "1px solid rgba(var(--border), 0.2)" 
          : "1px solid rgba(0, 0, 0, 0.08)",
        zIndex: 9999,
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: isDarkMode ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
      }}
      buttonStyle={{
        background: "rgb(var(--primary))",
        color: "rgb(var(--primary-foreground))",
        fontSize: "0.875rem",
        fontWeight: 500,
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        cursor: "pointer",
        transition: "background 0.2s ease-in-out",
        border: "none",
        boxShadow: isDarkMode ? "none" : "0 2px 5px rgba(var(--primary), 0.25)",
      }}
      declineButtonStyle={{
        background: isDarkMode ? "transparent" : "hsl(0 0% 97%)",
        color: isDarkMode ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        fontSize: "0.875rem",
        fontWeight: 500,
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        border: isDarkMode 
          ? "1px solid hsl(240 3.7% 25%)" 
          : "1px solid hsl(240 5% 84%)",
        boxShadow: isDarkMode ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
      contentStyle={{
        flex: 1,
        marginRight: "1rem",
        fontSize: "0.875rem",
      }}
      overlayStyle={{
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 9998,
      }}
      buttonWrapperClasses="flex gap-2 items-center"
      expires={365}
      enableDeclineButton
      onAccept={() => {
        if (acceptAnalytics) acceptAnalytics();
      }}
      onDecline={() => {
        if (declineAnalytics) declineAnalytics();
      }}
      customContentAttributes={{ className: "leading-relaxed" }}
      customButtonProps={{ className: "hover:bg-primary/90" }}
      customDeclineButtonProps={{ 
        className: isDarkMode 
          ? "hover:bg-muted" 
          : "hover:bg-gray-100 hover:border-gray-300"
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Cookie className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className={`mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800 font-medium"}`}>
            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
            By clicking "Accept All", you consent to our use of cookies as described in our{" "}
            <Link href="/cookie-policy" className="text-primary hover:underline font-medium">
              Cookie Policy
            </Link>.
          </p>
          <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Vercel Analytics is used to collect anonymous usage data for website improvement without tracking cookies.
          </p>
        </div>
      </div>
    </CookieConsentLib>
  );
}

export function CookieSettings() {
  const [showModal, setShowModal] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  if (!showModal) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5"
      >
        <Cookie className="h-4 w-4" />
        <span>Cookie Settings</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className={`bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 relative ${
        isDarkMode ? "" : "shadow-xl"
      }`}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-2 top-2" 
          onClick={() => setShowModal(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold mb-4">Cookie Settings</h2>
        
        <div className="space-y-4">
          <div className="p-3 border border-border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Essential Cookies</span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Always Active</span>
            </div>
            <p className="text-sm text-muted-foreground">
              These cookies are necessary for the website to function and cannot be switched off.
            </p>
          </div>
          
          <div className="p-3 border border-border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Analytics</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Clear cookies and reload
                  document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                      .replace(/^ +/, "")
                      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
                  });
                  window.location.reload();
                }}
              >
                Revoke
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              We use Vercel Analytics to collect anonymous usage data to help us improve our website. 
              It operates without tracking cookies.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
} 