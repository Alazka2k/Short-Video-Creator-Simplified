import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WorkbenchEmptyProps {
  className?: string;
}

export function WorkbenchEmpty({ className = '' }: WorkbenchEmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Briefcase className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Your content creation projects will appear here. Start by creating your first content.
      </p>
      <Link href="/create">
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Content
        </Button>
      </Link>
    </div>
  );
} 