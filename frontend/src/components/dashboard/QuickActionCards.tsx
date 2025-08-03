'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActionCards() {
  const router = useRouter();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="group relative hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden hover:scale-[1.02]">
        <div 
          className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300"
          style={{ 
            backgroundImage: 'url("/background/dashboard/quick_create.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Wand2 className="h-5 w-5" />
            </div>
            Create Content
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-muted-foreground mb-6 h-12">
            Generate a video from text in one click.
          </p>
          <Button 
            size="lg"
            onClick={() => router.push('/create')}
            className="w-full h-11 bg-gradient-to-r from-violet-500/80 to-purple-500/80 hover:from-violet-500 hover:to-purple-500 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] relative z-10"
          >
            Start Creating
          </Button>
        </CardContent>
      </Card>

      <Card className="group relative hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden hover:scale-[1.02]">
        <div 
          className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300"
          style={{ 
            backgroundImage: 'url("/background/dashboard/advanced_editor.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Library className="h-5 w-5" />
            </div>
            Content Workbench
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-muted-foreground mb-6 h-12">
            Access your past creations, drafts, and templates.
          </p>
          <Button 
            size="lg"
            onClick={() => router.push('/workbench')}
            className="w-full h-11 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-500 hover:to-cyan-500 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] relative z-10"
          >
            View Workbench
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 