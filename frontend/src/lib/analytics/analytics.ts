/**
 * Analytics service for Vercel Analytics integration
 * 
 * This is a placeholder service since Vercel Analytics is injected at build time
 * and doesn't require explicit setup. However, this file provides hooks
 * for future analytics integrations like Google Analytics.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

/**
 * Initialize analytics - this is a placeholder since Vercel Analytics
 * is automatically injected, but we could add additional providers here
 * in the future.
 */
export const initAnalytics = (consent: boolean) => {
  if (consent) {
    console.log("Analytics initialized with consent");
  } else {
    console.log("Analytics disabled due to lack of consent");
  }
};

/**
 * Track page view - currently a placeholder for future integrations
 * Vercel Analytics tracks page views automatically
 */
export const trackPageView = (url: string) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] Page view: ${url}`);
  }
};

/**
 * Track custom event - currently a placeholder for future integrations
 */
export const trackEvent = (event: AnalyticsEvent) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] Event: ${event.name}`, event.properties);
  }
}; 