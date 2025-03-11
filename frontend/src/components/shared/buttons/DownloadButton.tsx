import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DownloadButtonProps {
  onDownload: () => Promise<void>;
  title?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  showIcon?: boolean;
}

export function DownloadButton({ 
  onDownload,
  title = 'Download',
  className = '',
  disabled = false,
  variant = 'outline',
  showIcon = true
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    try {
      await onDownload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download content",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className={`gap-2 ${variant === 'outline' ? 'border-2 hover:border-primary/50 transition-colors' : ''} ${className}`}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          {showIcon && <Download className="w-4 h-4" />}
          {title}
        </>
      )}
    </Button>
  );
} 