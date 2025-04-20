import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, FileUp, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Declare global type for window with our custom property
declare global {
  interface Window {
    __videoCreationTrigger?: () => void;
  }
}

// Minimal logging helper that only logs important events
function log(message: string, data?: any, isImportant = false) {
  // Only log when debugging is enabled AND it's an important event
  if (typeof window !== 'undefined' && window.__debugCreatePage && isImportant) {
    console.log(`[CreateButtons] ${message}`, data || '');
  }
}

interface CreateContentButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isGenerating: boolean;
  progress?: number;
  status?: string;
  className?: string;
}

export function CreateContentButton({ 
  onClick, 
  isDisabled, 
  isGenerating, 
  progress = 0, 
  status = '',
  className 
}: CreateContentButtonProps) {
  const { toast } = useToast();

  const handleClick = async () => {
    if (isDisabled || isGenerating) return;
    
    try {
      toast({
        title: "Content creation started",
        description: "Your content is being generated. Please wait.",
      });
      
      // Try to use the window method first if available, otherwise fall back to the passed handler
      if (typeof window !== 'undefined' && window.__videoCreationTrigger) {
        window.__videoCreationTrigger();
      } else {
        // Fall back to the provided onClick handler
        onClick();
      }
    } catch (error) {
      console.error('Content creation error:', error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: "Failed to start content creation. Please try again.",
      });
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={isDisabled || isGenerating}
      className={cn(
        "gap-2",
        isGenerating || status === 'polling' ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/90",
        className
      )}
      size="lg"
    >
      {isGenerating || status === 'polling' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {status === 'polling' 
            ? `Creating... ${progress}%` 
            : 'Preparing...'}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Create Content
        </>
      )}
    </Button>
  );
}

interface CreateButtonsProps {
  onCreateContent: () => void;
  isDisabled?: boolean;
  isGenerating: boolean;
  progress?: number;
  status?: string;
  onLoadTemplate?: () => void;
  onSaveTemplate?: () => void;
  // Validation props
  prompt?: string;
  selectedDuration?: any;
  selectedContent?: {
    voice?: boolean;
    visuals?: boolean;
    music?: boolean;
  };
  selectedVoice?: string;
  visualSettings?: {
    aspectRatio?: string;
    shotStyle?: string;
  };
}

export function CreateButtons({ 
  onCreateContent, 
  isDisabled: externalDisabled, 
  isGenerating, 
  progress = 0,
  status = '',
  onLoadTemplate,
  onSaveTemplate,
  // Extract validation props
  prompt = '',
  selectedDuration,
  selectedContent = { voice: false, visuals: false },
  selectedVoice = '',
  visualSettings = { aspectRatio: '' }
}: CreateButtonsProps) {
  // Use refs to track previous state for comparison
  const prevPropsRef = useRef({
    prompt,
    selectedDuration,
    selectedContent,
    selectedVoice,
    visualSettings,
    isGenerating
  });
  
  // Only log when props actually change
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    
    // Check if any important props have changed
    const hasContentTypeChanged = JSON.stringify(prevProps.selectedContent) !== JSON.stringify(selectedContent);
    const hasGeneratingChanged = prevProps.isGenerating !== isGenerating;
    
    // Only log meaningful changes
    if (hasContentTypeChanged || hasGeneratingChanged) {
      log('Important props changed', {
        contentTypeChanged: hasContentTypeChanged,
        generatingStateChanged: hasGeneratingChanged,
        isGenerating
      }, true);
    }
    
    // Update the ref with current values
    prevPropsRef.current = {
      prompt,
      selectedDuration,
      selectedContent,
      selectedVoice,
      visualSettings,
      isGenerating
    };
  }, [prompt, selectedDuration, selectedContent, selectedVoice, visualSettings, isGenerating]);

  // Ensure values are defined
  const safePrompt = prompt || '';
  const safeSelectedContent = selectedContent || { voice: false, visuals: false };
  const safeVisualSettings = visualSettings || { aspectRatio: '' };
  
  // Validation logic exactly matching VideoCreationFlow
  const hasAnyContentSelected = safeSelectedContent.voice === true || 
                               safeSelectedContent.visuals === true || 
                               safeSelectedContent.music === true;
                               
  const canCreateContent = (
    (safePrompt.trim() !== '') &&                        // Has prompt
    (!!selectedDuration) &&                              // Has duration selected
    (hasAnyContentSelected) &&                           // At least one content type
    (!safeSelectedContent.voice || selectedVoice) &&     // Has voice if voice is selected
    (!safeSelectedContent.visuals || (safeVisualSettings.aspectRatio && safeVisualSettings.shotStyle)) && // Has both aspect ratio and shot style if visuals selected
    (!isGenerating)                                      // Not currently generating
  );

  // Track button state changes to only log when the button becomes enabled/disabled
  const [wasButtonEnabled, setWasButtonEnabled] = useState(false);
  const finalDisabled = externalDisabled !== undefined ? externalDisabled : !canCreateContent;
  
  useEffect(() => {
    const isEnabled = !finalDisabled;
    
    // Only log when the button's enabled state changes
    if (isEnabled !== wasButtonEnabled) {
      log(`Button is now ${isEnabled ? 'enabled' : 'disabled'}`, {
        prompt: !!safePrompt.trim(),
        duration: !!selectedDuration,
        contentSelected: hasAnyContentSelected,
        voiceValid: !safeSelectedContent.voice || !!selectedVoice,
        visualsValid: !safeSelectedContent.visuals || (!!safeVisualSettings.aspectRatio && !!safeVisualSettings.shotStyle),
        visualSettings: safeSelectedContent.visuals ? {
          aspectRatio: !!safeVisualSettings.aspectRatio ? 'valid' : 'invalid',
          shotStyle: !!safeVisualSettings.shotStyle ? 'valid' : 'invalid'
        } : 'not required',
        isGenerating
      }, true);
      
      setWasButtonEnabled(isEnabled);
    }
  }, [finalDisabled, safePrompt, selectedDuration, hasAnyContentSelected, 
      safeSelectedContent, selectedVoice, safeVisualSettings, isGenerating, wasButtonEnabled]);

  const handleCreateClick = () => {
    log('Create button clicked', null, true);
    
    if (typeof window !== 'undefined' && window.__videoCreationTrigger) {
      window.__videoCreationTrigger();
    } else {
      onCreateContent();
    }
  };

  return (
    <div className="flex items-center justify-between my-4">
      {/* Progress indicator (only shows when generating) */}
      {isGenerating && status === 'polling' && (
        <div className="absolute top-[-20px] left-0 right-0 mx-auto w-full max-w-md">
          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
            <div 
              className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <Button 
        variant="outline" 
        onClick={onLoadTemplate}
        disabled={true} // TODO: Template features not implemented yet
        className="gap-2 border-2 hover:border-primary/50 transition-colors"
      >
        <FileUp className="w-4 h-4" />
        Load Template
      </Button>

      <CreateContentButton
        onClick={handleCreateClick}
        isDisabled={finalDisabled}
        isGenerating={isGenerating}
        progress={progress}
        status={status}
      />
      
      <Button 
        variant="outline"
        onClick={onSaveTemplate}
        disabled={true} // TODO: Template features not implemented yet
        className="gap-2 border-2 hover:border-primary/50 transition-colors"
      >
        <FileDown className="w-4 h-4" />
        Save as Template
      </Button>
    </div>
  );
}
