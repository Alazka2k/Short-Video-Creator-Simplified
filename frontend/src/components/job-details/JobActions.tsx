import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AssemblyButton } from './buttons/AssemblyButton';
import { DownloadButton } from '@/components/shared/buttons/DownloadButton';
import { handleBulkDownload } from '@/lib/utils/download';

interface JobActionsProps {
  jobId: string;
  selectedTemplateId: string | null;
  scenes: Array<{
    sceneId: number;
    image?: { publicUrl: string; storageKey: string; metadata: any };
    video?: { publicUrl: string; storageKey: string; metadata: any };
    voice?: { publicUrl: string; storageKey: string; metadata: any };
    animation?: { publicUrl: string; storageKey: string; metadata: any };
  }>;
  title?: string;
}

export function JobActions({ jobId, selectedTemplateId, scenes, title }: JobActionsProps) {
  const router = useRouter();

  const handleDownload = async () => {
    await handleBulkDownload(scenes, jobId, title || 'content');
  };

  return (
    <div className="flex items-center justify-between">
      <Button 
        variant="outline" 
        onClick={() => router.push('/workbench')}
        className="gap-2 border-2 hover:border-primary/50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workbench
      </Button>

      <AssemblyButton 
        jobId={jobId} 
        selectedTemplateId={selectedTemplateId} 
      />

      <DownloadButton 
        onDownload={handleDownload}
        title="Download All"
        disabled={!scenes || scenes.length === 0}
        variant="outline"
        showIcon={true}
      />
    </div>
  );
} 