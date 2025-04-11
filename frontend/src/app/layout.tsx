import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Auth0ProviderWrapper } from '@/components/providers/auth0-provider';
import { ConsentProvider } from '@/components/providers/consent-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';
import { logEnvironmentConfig } from '@/lib/debug/env-logger';
import { ApiProvider } from '@/components/providers/api-provider';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

// Log environment configuration in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentConfig();
}

export const metadata: Metadata = {
  title: 'Narravid',
  description: 'Break Content Barriers - Create engaging videos with AI',
  icons: {
    icon: [
      {
        url: '/branding/dark/logo.svg',
        media: '(prefers-color-scheme: dark)',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        url: '/branding/white/logo.svg',
        media: '(prefers-color-scheme: light)',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        url: '/icons/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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