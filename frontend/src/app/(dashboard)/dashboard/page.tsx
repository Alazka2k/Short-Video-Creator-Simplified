import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenUsage } from '@/components/dashboard/billing/token-usage';
import { PlusIcon, Wand2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Create and manage your video content',
};

export default function DashboardPage() {
  return (
    <div className="relative flex-1 space-y-8 p-8 pt-6">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-background to-background" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-violet-500/20 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl animate-drift-slow" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/background/dashboard/grid.svg')] bg-repeat opacity-20" />
        
        {/* Noise effect */}
        <div className="absolute inset-0 bg-[url('/background/dashboard/noise.svg')] opacity-[0.25] mix-blend-soft-light" />
      </div>

      {/* Header section */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              Create Something Amazing
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Transform your ideas into engaging videos in minutes
            </p>
          </div>
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-105"
          >
            <PlusIcon className="h-6 w-6" />
            New Video
          </Button>
        </div>

        {/* Quick action cards */}
        <div className="grid gap-8 mt-12 md:grid-cols-2">
          <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm border-violet-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-shadow">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                Quick Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground mb-8">
                Generate a video from text in one click. Perfect for quick content creation.
              </p>
              <Button 
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-violet-500/90 to-purple-500/90 hover:from-violet-500 hover:to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300 hover:scale-[1.02]"
              >
                Start Quick Create
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm border-blue-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-shadow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                Advanced Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground mb-8">
                Full control over scenes, style, and generation settings.
              </p>
              <Button 
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-[1.02]"
              >
                Open Editor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Token usage section */}
      <div className="relative mt-16">
        <TokenUsage />
      </div>
    </div>
  );
} 