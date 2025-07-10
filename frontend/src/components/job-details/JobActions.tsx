'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AssemblyButton } from './buttons/AssemblyButton';
import { DownloadButton } from '@/components/shared/buttons/DownloadButton';
import { handleBulkDownload, DownloadError } from '@/lib/utils/download';
import { useApiClient } from '@/lib/api/apiClient';
import { ErrorCard } from '@/components/shared/error/ErrorCard';
import { useAuth } from '@/lib/hooks/useAuth';

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
  status: string;
}

export function JobActions({ jobId, selectedTemplateId, scenes, title, status }: JobActionsProps) {
  const router = useRouter();
  const api = useApiClient();
  const { user } = useAuth();
  const [downloadError, setDownloadError] = useState<DownloadError | null>(null);

  const handleDownload = async () => {
    setDownloadError(null); // Clear previous errors before starting
    try {
      await handleBulkDownload(api, scenes, jobId, title || 'content');
    } catch (error) {
      if (error instanceof DownloadError) {
        setDownloadError(error);
      } else {
        // Handle unexpected errors
        setDownloadError(new DownloadError('An unexpected error occurred during the download.', error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const isDownloadDisabled = status !== 'completed' || !scenes || scenes.length === 0;

  return (
    <>
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
          disabled={isDownloadDisabled}
          variant="outline"
          showIcon={true}
        />
      </div>
      {downloadError && (
        <div className="mt-4">
          <ErrorCard
            title="Download Failed"
            variant="warning"
            onDismiss={() => setDownloadError(null)}
            details={downloadError.details}
            showAdminDetails={user?.isAdmin}
          >
            <p>{downloadError.message}</p>
          </ErrorCard>
        </div>
      )}
    </>
  );
} 