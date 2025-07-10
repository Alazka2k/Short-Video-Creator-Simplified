import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Auth0ProviderWrapper } from "@/components/providers/auth0-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Narravid",
  description: "Create short-form videos with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Auth0ProviderWrapper>
              {children}
              <Toaster />
            </Auth0ProviderWrapper>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
} 