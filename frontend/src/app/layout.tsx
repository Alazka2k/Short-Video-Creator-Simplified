import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Auth0ProviderWrapper } from '@/components/providers/auth0-provider';
import { ConsentProvider } from '@/components/providers/consent-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';
import { logEnvironmentConfig } from '@/lib/debug/env-logger';
import { ApiProvider } from '@/components/providers/api-provider';

const inter = Inter({ subsets: ['latin'] });

// Log environment configuration in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentConfig();
}

export const metadata = {
  title: 'Video Creator',
  description: 'Create engaging videos with AI',
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
            storageKey="video-creator-theme"
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