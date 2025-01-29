import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Image from 'next/image'
import aspectRatioData from '@/data/video-creation/image/aspect-ratio_select-option.json'

interface FormatOption {
  id: string
  name: string
  description: string
  width: number
  height: number
  previewImages: string
}

// Reorder options to match desired order: 9:16, 1:1, 16:9
const orderedFormats = ['9:16', '1:1', '16:9']
const formatTypes = orderedFormats
  .map(id => aspectRatioData.options.find(option => option.id === id))
  .filter((format): format is FormatOption => format !== undefined)

interface FormatSelectionProps {
  selectedFormat: string
  setSelectedFormat: (format: string) => void
  isGenerating: boolean
}

export function FormatSelection({
  selectedFormat,
  setSelectedFormat,
  isGenerating
}: FormatSelectionProps) {
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null)

  return (
    <div className="space-y-4 pb-12">
      <h3 className="text-sm font-medium">Format</h3>
      <div className="grid gap-6 sm:grid-cols-3 p-1">
        {formatTypes.map((format) => (
          <Card 
            key={format.id} 
            className={cn(
              "cursor-pointer transition-all hover:scale-[1.02] flex flex-col h-[500px]",
              selectedFormat === format.id 
                ? "ring-2 ring-primary ring-offset-8 ring-offset-background" 
                : "hover:border-primary/50"
            )}
            onClick={() => !isGenerating && setSelectedFormat(format.id)}
            onMouseEnter={() => setHoveredCard(format.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardContent className="p-6 flex-1 flex flex-col">
              {/* Title Section - Fixed Height */}
              <div className="h-[60px] flex flex-col items-center justify-center">
                <div className="font-medium text-lg">{format.name}</div>
                <div className="text-sm text-muted-foreground">
                  ({format.id})
                </div>
              </div>

              {/* Preview Image - centered */}
              <div className="flex-1 flex items-center justify-center py-6">
                <div className={cn(
                  "relative w-full mx-auto",
                  format.id === '9:16' && "max-w-[200px]",
                  format.id === '1:1' && "max-w-[280px]",
                  format.id === '16:9' && "max-w-[320px]"
                )}>
                  <AspectRatio
                    ratio={format.width / format.height}
                    className="bg-muted relative overflow-hidden"
                  >
                    <div className="absolute inset-0 border-2 border-border rounded-lg z-10" />
                    <Image
                      src={format.previewImages}
                      alt={format.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  </AspectRatio>
                </div>
              </div>

              {/* Description - Fixed Height */}
              <div className="h-[10px] flex items-center justify-center">
                <div className="text-sm text-muted-foreground text-center px-4">
                  {format.description}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 