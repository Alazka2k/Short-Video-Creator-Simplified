'use client'

import { VideoCreationFlow } from '@/components/video-creation/VideoCreationFlow'
import { useSearchParams } from 'next/navigation'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { useState, useRef, useEffect } from 'react'
import { CreateButtons } from '@/components/shared/buttons/CreateButtons'

// Declare global type for window with our custom property
declare global {
  interface Window {
    __updateCreatePageState?: (state: any) => void;
    __videoCreationTrigger?: () => void;
    __debugCreatePage?: boolean;
  }
}

// Enable debugging but with reduced verbosity - show only important events
if (typeof window !== 'undefined') {
  window.__debugCreatePage = true; // Set to true to enable focused logging
}

// Helper for debugging that only logs important information
function debugLog(message: string, data?: any, force = false) {
  // Only log when it's a forced (important) message
  if ((typeof window !== 'undefined' && window.__debugCreatePage && force)) {
    console.log(`[CreatePage] ${message}`, data || '');
  }
}

// Define types for validation data
interface ValidationData {
  prompt: string;
  selectedDuration: any;
  selectedContent: {
    voice: boolean;
    visuals: boolean;
    music?: boolean;
  };
  selectedVoice: string;
  visualSettings: {
    aspectRatio: string;
    shotStyle: string;
    [key: string]: any;
  };
}

export default function CreatePage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'normal'
  
  // Track video creation state for the action button
  const [creationState, setCreationState] = useState({
    isGenerating: false,
    progress: 0,
    status: ''
  })

  // Store validation data with proper typing
  const [validationData, setValidationData] = useState<ValidationData>({
    prompt: '',
    selectedDuration: null,
    selectedContent: { voice: false, visuals: false },
    selectedVoice: '',
    visualSettings: { aspectRatio: '', shotStyle: '' }
  });

  // Keep previous validation data to compare for changes
  const prevValidationDataRef = useRef(validationData);

  // Add reference to track button enabled state
  const prevButtonEnabledRef = useRef<boolean>(false);

  // Keep triggerButtonRef to access create content trigger button
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Setup a global updater function that can be called from anywhere
  useEffect(() => {
    // Create a global function to update state from the VideoCreationFlow component
    if (typeof window !== 'undefined') {
      window.__updateCreatePageState = (newState: any) => {
        // Only log when generation state changes
        if (newState.isGenerating !== undefined && 
            newState.isGenerating !== creationState.isGenerating) {
          debugLog(
            newState.isGenerating ? 'Content generation started' : 'Content generation completed', 
            { progress: newState.progress, status: newState.status }, 
            true // Force log for important state change
          );
        }
        
        if (newState.isGenerating !== undefined) {
          setCreationState(prev => ({
            ...prev,
            isGenerating: newState.isGenerating,
            progress: newState.progress ?? prev.progress,
            status: newState.status ?? prev.status
          }));
        }
        
        if (newState.validationData) {
          // Deep clone to ensure state update is detected
          const newValidationData = {
            prompt: newState.validationData.prompt ?? '',
            selectedDuration: newState.validationData.selectedDuration ?? null,
            selectedContent: {
              voice: !!newState.validationData.selectedContent?.voice,
              visuals: !!newState.validationData.selectedContent?.visuals,
              music: !!newState.validationData.selectedContent?.music
            },
            selectedVoice: newState.validationData.selectedVoice ?? '',
            visualSettings: {
              aspectRatio: newState.validationData.visualSettings?.aspectRatio ?? '',
              shotStyle: newState.validationData.visualSettings?.shotStyle ?? '',
              ...(newState.validationData.visualSettings ?? {})
            }
          };
          
          // Only update if something actually changed
          if (JSON.stringify(newValidationData) !== JSON.stringify(prevValidationDataRef.current)) {
            // Compute whether the button should be enabled based on the validation data
            const promptValid = !!newValidationData.prompt?.trim();
            const durationValid = !!newValidationData.selectedDuration;
            const contentSelected = newValidationData.selectedContent?.voice === true || 
                                   newValidationData.selectedContent?.visuals === true || 
                                   newValidationData.selectedContent?.music === true;
            const voiceValid = !newValidationData.selectedContent?.voice || !!newValidationData.selectedVoice;
            const visualsValid = !newValidationData.selectedContent?.visuals || 
                                (!!newValidationData.visualSettings?.aspectRatio && 
                                 !!newValidationData.visualSettings?.shotStyle);
            
            const buttonShouldBeEnabled = promptValid && durationValid && contentSelected && voiceValid && visualsValid;
            
            // Only log if the button enabled state would change
            if (buttonShouldBeEnabled !== prevButtonEnabledRef.current) {
              debugLog('Form values changed, button state: ' + (buttonShouldBeEnabled ? 'enabled' : 'disabled'), {
                prompt: promptValid ? 'valid' : 'invalid',
                duration: durationValid ? 'valid' : 'invalid',
                contentSelected: contentSelected ? 'valid' : 'invalid',
                voice: voiceValid ? 'valid' : 'invalid',
                visuals: visualsValid ? 'valid' : 'invalid',
                visualSettings: newValidationData.selectedContent?.visuals ? {
                  aspectRatio: !!newValidationData.visualSettings?.aspectRatio ? 'valid' : 'invalid',
                  shotStyle: !!newValidationData.visualSettings?.shotStyle ? 'valid' : 'invalid'
                } : 'not required'
              }, true);
              
              prevButtonEnabledRef.current = buttonShouldBeEnabled;
            }
            
            prevValidationDataRef.current = newValidationData;
            setValidationData(newValidationData);
          }
        }
      };

      // Hook up video creation trigger
      window.__videoCreationTrigger = () => {
        debugLog('Video creation triggered', null, true); // Force log for button click
        if (triggerButtonRef.current) {
          triggerButtonRef.current.click();
        }
      };

      return () => {
        // Clean up
        delete window.__updateCreatePageState;
        delete window.__videoCreationTrigger;
      };
    }
  }, [creationState.isGenerating]);

  // Update ref when validation data changes
  useEffect(() => {
    prevValidationDataRef.current = validationData;
  }, [validationData]);

  // Placeholder functions for template handling
  const handleLoadTemplate = () => {
    debugLog('Load template clicked', null, true); // Force log for button click
  }

  const handleSaveTemplate = () => {
    debugLog('Save template clicked', null, true); // Force log for button click
  }

  const handleCreateContent = () => {
    debugLog('Create content button clicked', null, true); // Force log for button click
    if (triggerButtonRef.current) {
      triggerButtonRef.current.click();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="grid gap-8">
            {/* Header section */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Create Your Content
              </h1>
              <p className="text-muted-foreground text-lg">
                {mode === 'quick' ? 
                  'Quickly create a video with AI-powered automation' : 
                  'Create a fully customized video with advanced settings'}
              </p>
            </div>

            {/* Action buttons using the CreateButtons component */}
            <div className="relative w-full">
              <CreateButtons
                onCreateContent={handleCreateContent}
                isGenerating={creationState.isGenerating}
                progress={creationState.progress}
                status={creationState.status}
                onLoadTemplate={handleLoadTemplate}
                onSaveTemplate={handleSaveTemplate}
                // Pass all validation props explicitly
                prompt={validationData.prompt}
                selectedDuration={validationData.selectedDuration}
                selectedContent={validationData.selectedContent}
                selectedVoice={validationData.selectedVoice}
                visualSettings={validationData.visualSettings}
              />
            </div>

            {/* Video creation interface */}
            <div className="relative">
              {/* Main interface */}
              <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="p-8">
                  <VideoCreationFlow 
                    mode={mode} 
                    renderActionButton={(onClick, isDisabled, isGenerating, jobProgress, validationProps) => {
                      // Instead of directly updating state here (which causes errors),
                      // we'll use the global function we created to update state
                      if (typeof window !== 'undefined' && 
                          window.__updateCreatePageState && 
                          (isGenerating !== creationState.isGenerating || 
                           jobProgress?.progress !== creationState.progress || 
                           jobProgress?.status !== creationState.status ||
                           validationProps)) {
                        
                        // We need this to run after rendering
                        setTimeout(() => {
                          // Use the global function to update state
                          window.__updateCreatePageState!({
                            isGenerating,
                            progress: jobProgress?.progress || 0,
                            status: jobProgress?.status || '',
                            validationData: validationProps
                          });
                        }, 0);
                      }
                      
                      // Create and return the hidden button - this is what will be clicked
                      return (
                        <button
                          id="create-content-trigger"
                          ref={triggerButtonRef}
                          onClick={(e) => {
                            e.preventDefault();
                            debugLog('Hidden button clicked', null, true); // Force log for important action
                            onClick();
                          }}
                          className="hidden"
                          type="button"
                          aria-hidden="true"
                        />
                      );
                    }}
                  />
                </div>
              </div>
              {/* Border gradient effect */}
              <div className="absolute inset-0 -z-10 rounded-xl">
                <div className="absolute inset-[-3px] rounded-xl">
                  <HoverBorderGradient
                    as="div"
                    containerClassName="w-full h-full"
                    className="bg-transparent"
                    duration={3}
                  />
                </div>
                {/* Inner mask to hide gradient from center */}
                <div className="absolute inset-[1px] bg-background rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}; 