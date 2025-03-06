import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { handleBulkDownload } from '@/lib/utils/download';

interface DownloadAllButtonProps {
  jobId: string;
  scenes: Array<{
    sceneId: number;
    image?: { publicUrl: string; storageKey: string; metadata: any };
    video?: { publicUrl: string; storageKey: string; metadata: any };
    voice?: { publicUrl: string; storageKey: string; metadata: any };
    animation?: { publicUrl: string; storageKey: string; metadata: any };
  }>;
  title?: string;
  className?: string;
}

export function DownloadAllButton({ jobId, scenes, title = 'content', className }: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadAll = async () => {
    if (!scenes || scenes.length === 0) {
      toast({
        variant: "destructive",
        title: "No content to download",
        description: "There are no scenes available to download.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      await handleBulkDownload(
        scenes, 
        jobId,
        title
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownloadAll}
      disabled={isDownloading || !scenes || scenes.length === 0}
      className={`gap-2 border-2 hover:border-primary/50 transition-colors ${className || ''}`}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download All
        </>
      )}
    </Button>
  );
} 