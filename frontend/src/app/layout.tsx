import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Auth0ProviderWrapper } from '@/components/providers/auth0-provider';
import { ConsentProvider } from '@/components/providers/consent-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';
import { logEnvironmentConfig } from '@/lib/debug/env-logger';
import { ApiProvider } from '@/components/providers/api-provider';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

// Log environment configuration in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentConfig();
}

// Define viewport for Next.js 13+ according to the warnings
export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

// Define metadata for Next.js 13+
export const metadata: Metadata = {
  title: 'Narravid - Transform Prompts into Visual Stories',
  description: 'Transform an idea into video scenes with voice, visuals, music, and animation.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log environment config once per app load
  logEnvironmentConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Fix for prefetched resources warning - properly defining preloaded assets */}
        <meta name="next-size-adjust" />
        
        {/* Preload the demo video */}
        <link rel="preload" href="/prelaunch/demo-reel.mp4" as="video" type="video/mp4" />
        
        {/* Add a more permissive Content-Security-Policy for media and YouTube */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; media-src * blob: data:; frame-src * data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.youtube.com https://*.youtube-nocookie.com https://*.tiktok.com https://*.ttwstatic.com https://*.tiktokcdn.com; style-src 'self' 'unsafe-inline' https://*.tiktok.com https://*.tiktokcdn.com; img-src * data: blob:; font-src 'self' data:; connect-src *;"
        />
        
        <Script
          id="handle-runtime-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Silence Chrome extension errors
              window.addEventListener('error', function (e) {
                if (e.message.includes('runtime.lastError') || 
                    e.message.includes('Unchecked runtime.lastError') ||
                    e.error && e.error.message && e.error.message.includes('runtime.lastError')) {
                  console.debug('Suppressed Chrome extension error:', e.message);
                  e.stopPropagation();
                  e.preventDefault();
                  return true;
                }
              }, true);

              // Fix preload warnings
              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type !== 'childList') continue;
                  for (const node of mutation.addedNodes) {
                    if (node.nodeName === 'LINK' && 
                        node.rel === 'preload' && 
                        !node.hasAttribute('as')) {
                      const href = node.getAttribute('href');
                      if (href.includes('.css')) {
                        node.setAttribute('as', 'style');
                      } else if (href.includes('.js')) {
                        node.setAttribute('as', 'script');
                      } else if (href.includes('.json')) {
                        node.setAttribute('as', 'fetch');
                      } else if (href.includes('.woff') || href.includes('.woff2')) {
                        node.setAttribute('as', 'font');
                      }
                    }
                  }
                }
              });
              
              observer.observe(document.head, { childList: true, subtree: true });
            `
          }}
        />
      </head>
      <body className={inter.className}>
        <Auth0ProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            storageKey="narravid-theme"
          >
            <ConsentProvider>
              <ApiProvider>
                {children}
              </ApiProvider>
            </ConsentProvider>
            <Toaster />
          </ThemeProvider>
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
} 