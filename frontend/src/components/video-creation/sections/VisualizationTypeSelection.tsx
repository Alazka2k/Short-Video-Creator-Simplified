'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VisualizationTypeSelectionProps {
  selectedVisualization: 'plain' | 'video' | 'animation'
  setSelectedVisualization: React.Dispatch<React.SetStateAction<'plain' | 'video' | 'animation'>>
  isGenerating: boolean
}

export function VisualizationTypeSelection({
  selectedVisualization,
  setSelectedVisualization,
  isGenerating
}: VisualizationTypeSelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Visualization Type</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {['plain', 'video', 'animation'].map((type) => (
          <Card key={type} className={cn(
            "cursor-pointer transition-colors",
            selectedVisualization === type ? "border-primary" : "hover:border-primary/50"
          )}
          onClick={() => !isGenerating && setSelectedVisualization(type as 'plain' | 'video' | 'animation')}
          >
            <CardContent className="p-4">
              <div className="font-medium capitalize">{type}</div>
              <div className="text-sm text-muted-foreground">
                {type === 'plain' ? 'Static images' : 
                 type === 'video' ? 'Video sequences' : 
                 'Animated visuals'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 