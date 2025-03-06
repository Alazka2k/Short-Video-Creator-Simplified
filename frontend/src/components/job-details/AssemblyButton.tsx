import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAssembly } from '@/lib/hooks/useAssembly';

interface AssemblyButtonProps {
  jobId: string;
  selectedTemplateId: string | null;
  className?: string;
}

export function AssemblyButton({ jobId, selectedTemplateId, className }: AssemblyButtonProps) {
  const [isAssembling, setIsAssembling] = useState(false);
  const { toast } = useToast();
  const { assembleVideo } = useAssembly();

  const handleAssemble = async () => {
    if (!selectedTemplateId) {
      toast({
        variant: "destructive",
        title: "Template required",
        description: "Please select a template for your video.",
      });
      return;
    }

    // Show toast notification immediately
    toast({
      title: "Video assembly started",
      description: "Your video is being assembled. Check the Videos page when complete.",
    });

    setIsAssembling(true);
    try {
      const result = await assembleVideo({
        jobId,
        templateId: selectedTemplateId
      });
      
      if (result.status === 'error') {
        throw new Error(result.error || 'Assembly failed');
      }
      
      console.log('Assembly response:', result);
      
      // Only open videos page in a new tab if the assembly is completed
      if (result.status === 'completed') {
        console.log('Assembly status is completed, opening videos page');
        
        try {
          // Get the base URL of the current page
          const baseUrl = window.location.origin;
          const videosUrl = `${baseUrl}/videos`;
          console.log('Opening URL:', videosUrl);
          
          // Use window.open with _blank target to open in a new tab
          const newWindow = window.open(videosUrl, '_blank');
          
          // Check if the window was successfully opened
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.warn('Popup was blocked or failed to open');
            // Inform the user that they may need to allow popups
            toast({
              title: "Popup Blocked",
              description: "Please allow popups to open the Videos page automatically.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error opening new tab:', error);
        }
        
        // Show completion notification
        toast({
          title: "Video assembly completed",
          description: "Your video has been assembled successfully. Opening Videos page.",
        });
      } else {
        console.log('Assembly status is not completed:', result.status);
      }
    } catch (error) {
      console.error('Assembly error:', error);
      toast({
        variant: "destructive",
        title: "Assembly failed",
        description: "Failed to start video assembly. Please try again.",
      });
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleAssemble}
      disabled={isAssembling || !selectedTemplateId}
      className={`gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 px-8 ${className || ''}`}
    >
      {isAssembling ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Assembling...
        </>
      ) : (
        <>
          <PlayCircle className="w-4 h-4" />
          Assemble Video
        </>
      )}
    </Button>
  );
} 