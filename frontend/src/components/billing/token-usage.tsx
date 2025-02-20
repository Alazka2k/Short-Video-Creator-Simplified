'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Coins, Zap, Video, Image, Music, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Dummy data
const dummyUsage = {
  tokens: {
    total: 10000,
    used: 6500,
    remaining: 3500,
    expiresAt: '2024-02-15T00:00:00Z',
  },
  usage: {
    videoGeneration: 4000,
    imageGeneration: 1500,
    voiceGeneration: 600,
    musicGeneration: 400,
  },
  limits: {
    maxTokensPerMonth: 10000,
    maxVideosPerMonth: 50,
    maxDurationPerVideo: 300,
  },
};

const usageConfig = [
  {
    label: 'Video Generation',
    value: 'videoGeneration',
    icon: Video,
    color: 'from-violet-500 to-purple-500',
    hoverColor: 'group-hover:from-violet-600 group-hover:to-purple-600',
  },
  {
    label: 'Image Generation',
    value: 'imageGeneration',
    icon: Image,
    color: 'from-blue-500 to-cyan-500',
    hoverColor: 'group-hover:from-blue-600 group-hover:to-cyan-600',
  },
  {
    label: 'Voice Generation',
    value: 'voiceGeneration',
    icon: Mic,
    color: 'from-pink-500 to-rose-500',
    hoverColor: 'group-hover:from-pink-600 group-hover:to-rose-600',
  },
  {
    label: 'Music Generation',
    value: 'musicGeneration',
    icon: Music,
    color: 'from-green-500 to-emerald-500',
    hoverColor: 'group-hover:from-green-600 group-hover:to-emerald-600',
  },
] as const;

export function TokenUsage() {
  const router = useRouter();
  const percentageUsed = (dummyUsage.tokens.used / dummyUsage.tokens.total) * 100;
  const daysUntilExpiry = Math.ceil(
    (new Date(dummyUsage.tokens.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      {/* Main token usage card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Token Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  {dummyUsage.tokens.used.toLocaleString()} / {dummyUsage.tokens.total.toLocaleString()} tokens used
                </div>
                <div className="text-sm text-muted-foreground">
                  {daysUntilExpiry} days remaining
                </div>
              </div>
              <Progress value={percentageUsed} className="h-2" />
            </div>

            {/* Quick actions */}
            <div className="flex gap-4">
              <Button 
                onClick={() => router.push('/dashboard/subscription')}
                className="flex-1 bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4 mr-2" />
                Buy More Tokens
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/subscription')}
                className="flex-1 hover:bg-primary/5 transition-all duration-200"
              >
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {usageConfig.map(({ label, value, icon: Icon, color, hoverColor }) => (
          <Card 
            key={value}
            className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl bg-gradient-to-br transition-all duration-300",
                  color,
                  hoverColor
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-2xl font-bold animate-in slide-in-from-bottom-2">
                    {dummyUsage.usage[value].toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Limits info */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle>Plan Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Token Limit</span>
              <span className="font-medium">{dummyUsage.limits.maxTokensPerMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Videos per Month</span>
              <span className="font-medium">{dummyUsage.limits.maxVideosPerMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Video Duration</span>
              <span className="font-medium">{Math.floor(dummyUsage.limits.maxDurationPerVideo / 60)} minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 