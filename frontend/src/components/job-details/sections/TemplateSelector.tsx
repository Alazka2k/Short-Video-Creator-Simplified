'use client'

import React, { useState, useEffect } from 'react'
import { Carousel } from '@/components/ui/carousel'
import templateData from '@/data/video-creation/assembly/template-select-option.json'
import Select from '@/components/ui/select'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import templateTypeOptions from "@/data/video-creation/assembly/template-type-select-option.json"
import Image from "next/image"
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useAuth } from '@/lib/auth/AuthContext'
import { LoadingScreen } from '@/components/ui/loading'

interface Template {
  id?: string
  name?: string
  description?: string
  templateId: string
  preview?: string
  aspectRatio?: string
  sceneAmount?: number
  planId?: string
  templateContent?: string[]
  subtitle?: string
  accountType?: string
  contentAllowed?: string[]
  modificationProperties?: Record<string, any>
  templateType?: string
}

interface TemplateSelectorProps {
  aspectRatio: string
  sceneCount: number
  onSelectTemplate: (templateId: string) => void
  selectedTemplateId: string | null
}

export function TemplateSelector({
  aspectRatio,
  sceneCount,
  onSelectTemplate,
  selectedTemplateId
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const { 
    data: subscriptionData, 
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    isError: isSubscriptionError
  } = useSubscription(user?.user_id?.toString())

  // Get the user's plan ID from the subscription data
  const userPlanId = subscriptionData?.data?.plan_id?.toString() || ''

  // Group templates by type
  const templateGroups = templates.reduce((groups: Record<string, Template[]>, template) => {
    const type = template.templateType || 'other'
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(template)
    return groups
  }, {})
  
  // Format template type options for the Select component
  const formattedTemplateTypeOptions = templateTypeOptions.options.map(option => ({
    id: option.templateType,
    value: option.templateType,
    label: option.name,
    description: option.description,
    icon: option.icon
  }))

  // Find the selected template from the full template data, not just filtered templates
  const selectedTemplate = selectedTemplateId 
    ? templateData.options.find(t => t.templateId === selectedTemplateId) 
    : null;
  const selectedTemplateName = selectedTemplate?.name || 'None'
  const selectedTemplateTypeName = selectedTemplate?.templateType || ''

  useEffect(() => {
    // Fetch templates from the API
    const fetchTemplates = async () => {
      try {
        // Don't fetch templates if we're still loading subscription or have an error
        if (isLoadingSubscription || isSubscriptionError) {
          return;
        }

        // For now, use the mock data
        const templates = templateData.options.filter(template => {
          // Filter by aspect ratio and scene count if provided
          const aspectRatioMatch = !aspectRatio || template.aspectRatio === aspectRatio;
          const sceneCountMatch = !sceneCount || template.sceneAmount === sceneCount;
          const planMatch = !userPlanId || !template.planId || template.planId === userPlanId;
          
          return aspectRatioMatch && sceneCountMatch && planMatch;
        });
        
        setTemplates(templates);
        
        // Set the first template type as selected if none is selected
        if (!selectedTemplateType && templates.length > 0) {
          const firstType = templateTypeOptions.options[0]?.templateType;
          if (firstType) {
            setSelectedTemplateType(firstType);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [aspectRatio, sceneCount, userPlanId, selectedTemplateId, selectedTemplateType, isLoadingSubscription, isSubscriptionError]);

  // Handle template type selection
  const handleTemplateTypeChange = (value: string | null) => {
    if (value) {
      // Always update the selected template type regardless of whether a template is selected
      setSelectedTemplateType(value);
    }
  }

  const handleClearSelection = () => {
    onSelectTemplate('')
  }

  // Show loading state while subscription data is being fetched
  if (isLoadingSubscription) {
    return (
      <div className="template-selector-container min-h-[200px] flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  // Show error state if subscription fetch failed
  if (isSubscriptionError) {
    return (
      <div className="template-selector-container min-h-[200px]">
        <div className="text-center">
          <p className="text-red-500 font-medium">Unable to load your subscription information</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  // Show message when no templates are available
  if (templates.length === 0) {
    return (
      <div className="template-selector-container">
        <div className="text-center">
          <p className="text-muted-foreground">No compatible templates found for your content.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Templates are filtered based on aspect ratio ({aspectRatio}), scene count ({sceneCount}), and your subscription plan.
          </p>
        </div>
      </div>
    )
  }

  // Convert templates to carousel slide format
  const mapTemplatesToSlides = (templates: Template[]) => {
    return templates.map(template => ({
      title: template.name || 'Untitled Template',
      description: template.description || '',
      src: template.preview || '',
      templateId: template.templateId,
      aspectRatio: template.aspectRatio,
      isVideo: template.preview?.endsWith('.mp4')
    }))
  }

  return (
    <div className="template-selector-container">
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Template Selection</h2>
          <p className="text-sm text-muted-foreground">
            Select a template that matches your content. Templates are filtered based on your content's aspect ratio and scene count.
          </p>
        </div>
        
        {/* Always show selected template information if something is selected */}
        {selectedTemplateId && selectedTemplateId !== '' && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full">
              <span className="text-sm mr-2">Selected:</span>
              <span className="font-medium text-sm">{selectedTemplateName}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-2 hover:bg-primary/20" 
                onClick={handleClearSelection}
              >
                <span className="sr-only">Clear selection</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
          </div>
        )}
        
        <div className={`mb-${selectedTemplateType && templates.find(t => t.templateType === selectedTemplateType)?.aspectRatio === '9:16' ? '6' : '1'}`}>
          <h3 className="text-base font-medium mb-3">Template Type</h3>
          <Select 
            data={formattedTemplateTypeOptions}
            onChange={handleTemplateTypeChange}
            value={selectedTemplateType || undefined}
            title="Select Template Type"
            allowDeselect={false}
          />
        </div>
        
        {selectedTemplateType && (
          <div className="space-y-6">
            <div className="w-full">
              <Carousel 
                slides={mapTemplatesToSlides(templates.filter(t => t.templateType === selectedTemplateType))}
                onSelectTemplate={(templateId: string) => onSelectTemplate(templateId)}
                selectedTemplateId={selectedTemplateId}
                groupName={selectedTemplateType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 