'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Coins, Zap, Video, Image, Music, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  },
  {
    label: 'Image Generation',
    value: 'imageGeneration',
    icon: Image,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Voice Generation',
    value: 'voiceGeneration',
    icon: Mic,
    color: 'from-pink-500 to-rose-500',
  },
  {
    label: 'Music Generation',
    value: 'musicGeneration',
    icon: Music,
    color: 'from-green-500 to-emerald-500',
  },
] as const;

export function TokenUsage() {
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
              <Button className="flex-1 gap-2">
                <Zap className="h-4 w-4" />
                Buy More Tokens
              </Button>
              <Button variant="outline" className="flex-1">
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {usageConfig.map(({ label, value, icon: Icon, color }) => (
          <Card key={value}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl bg-gradient-to-br",
                  color
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-2xl font-bold">
                    {dummyUsage.usage[value].toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Limits info */}
      <Card>
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