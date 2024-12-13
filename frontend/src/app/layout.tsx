import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Auth0ProviderWrapper } from '@/components/providers/auth0-provider';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="video-creator-theme"
        >
          <Auth0ProviderWrapper>
            {children}
          </Auth0ProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
} 