'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import templateData from '@/data/video-creation/assembly/template-select-option.json'

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
}

interface TemplateSelectorProps {
  aspectRatio: string
  sceneCount: number
  userPlanId: string
  onSelectTemplate: (templateId: string) => void
  selectedTemplateId: string | null
}

export function TemplateSelector({
  aspectRatio,
  sceneCount,
  userPlanId,
  onSelectTemplate,
  selectedTemplateId
}: TemplateSelectorProps) {
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])

  useEffect(() => {
    // Filter templates based on aspect ratio, scene count, and user plan
    const templates = templateData.options.filter(template => {
      // Check if aspect ratio matches (if specified)
      const aspectRatioMatch = !aspectRatio || !template.aspectRatio || template.aspectRatio === aspectRatio;
      
      // Check if scene count matches (if specified)
      const sceneCountMatch = !sceneCount || !template.sceneAmount || template.sceneAmount === sceneCount;
      
      // Check if user plan matches (if specified)
      const planMatch = !userPlanId || !template.planId || template.planId === userPlanId;
      
      return aspectRatioMatch && sceneCountMatch && planMatch;
    });
    
    setFilteredTemplates(templates);
    
    // Auto-select the first template if none is selected and there are templates available
    if (!selectedTemplateId && templates.length > 0) {
      onSelectTemplate(templates[0].templateId);
    }
  }, [aspectRatio, sceneCount, userPlanId, onSelectTemplate, selectedTemplateId]);

  if (filteredTemplates.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No compatible templates found for your content.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Templates are filtered based on aspect ratio ({aspectRatio}), scene count ({sceneCount}), and your plan.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {filteredTemplates.map((template) => (
        <Card 
          key={template.templateId}
          className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
            selectedTemplateId === template.templateId 
              ? 'ring-2 ring-primary ring-offset-2' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelectTemplate(template.templateId)}
        >
          <CardContent className="p-0">
            <div className="relative aspect-video w-full">
              {template.preview ? (
                template.preview.endsWith('.mp4') ? (
                  <video 
                    src={template.preview}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={template.preview}
                      alt={template.name || ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <p className="text-muted-foreground">No preview</p>
                </div>
              )}
              
              {selectedTemplateId === template.templateId && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check size={16} />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium">{template.name || 'Untitled Template'}</h3>
              <p className="text-sm text-muted-foreground">{template.description || 'No description available'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-muted px-2 py-1 rounded-md">{template.aspectRatio || 'Unknown'}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded-md">{template.sceneAmount || 'Unknown'} scenes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 