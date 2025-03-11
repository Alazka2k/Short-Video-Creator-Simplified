import { Video } from 'lucide-react';

interface VideoListEmptyProps {
  className?: string;
}

export function VideoListEmpty({ className = '' }: VideoListEmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Video className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Your generated videos will appear here. Start by creating content in the workbench.
      </p>
    </div>
  );
} 