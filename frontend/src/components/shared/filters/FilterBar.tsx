import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-standard"

export interface FilterBarProps {
  onFilterChange: (filters: Partial<{
    services?: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>) => void;
  serviceOptions?: { id: string; label: string; value: string }[];
  showServiceFilter?: boolean;
}

export function FilterBar({ 
  onFilterChange,
  serviceOptions = [
    { id: 'all', label: 'All Services', value: 'all' },
    { id: 'llm', label: 'LLM', value: 'llm' },
    { id: 'image', label: 'Image', value: 'image' },
    { id: 'voice', label: 'Voice', value: 'voice' },
    { id: 'music', label: 'Music', value: 'music' },
    { id: 'video', label: 'Video', value: 'video' },
    { id: 'animation', label: 'Animation', value: 'animation' }
  ],
  showServiceFilter = true
}: FilterBarProps) {
  const orderOptions = [
    { id: 'desc', label: 'Newest First', value: 'desc' },
    { id: 'asc', label: 'Oldest First', value: 'asc' }
  ]

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Service filter */}
      {showServiceFilter && (
        <div className="flex-1 min-w-[200px]">
          <Select
            onValueChange={(value) =>
              onFilterChange({ 
                services: value === 'all' ? undefined : [value]
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Service" />
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sort order */}
      <div className="flex-1 min-w-[200px]">
        <Select
          defaultValue="desc"
          onValueChange={(value) => 
            onFilterChange({ 
              sortOrder: value as 'asc' | 'desc',
              sortBy: 'created_at' // Always sort by creation date
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort Order" />
          </SelectTrigger>
          <SelectContent>
            {orderOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 