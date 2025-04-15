import { PrelaunchFooter } from "@/components/marketing/prelaunch-footer";
import { PrelaunchHeader } from "@/components/layout/prelaunch-header";

export default function LegalLayout({
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