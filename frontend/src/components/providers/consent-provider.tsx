"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CookieConsent } from "@/components/common/CookieConsent";
import { initAnalytics } from "@/lib/analytics/analytics";

interface ConsentContextType {
  analyticsConsent: boolean;
  setAnalyticsConsent: (value: boolean) => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // On mount, check if consent has already been given
  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("analytics-consent");
    if (consent === "true") {
      setAnalyticsConsent(true);
    }
  }, []);

  // Initialize analytics when consent changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("analytics-consent", analyticsConsent.toString());
      // Initialize analytics based on consent
      initAnalytics(analyticsConsent);
    }
  }, [analyticsConsent, mounted]);

  const handleAcceptAnalytics = () => {
    setAnalyticsConsent(true);
    console.log("Analytics consent granted");
  };

  const handleDeclineAnalytics = () => {
    setAnalyticsConsent(false);
    console.log("Analytics consent declined");
  };

  return (
    <ConsentContext.Provider value={{ analyticsConsent, setAnalyticsConsent }}>
      {children}
      <CookieConsent 
        acceptAnalytics={handleAcceptAnalytics} 
        declineAnalytics={handleDeclineAnalytics} 
      />
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
} 