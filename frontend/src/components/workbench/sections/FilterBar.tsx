import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-standard"

interface FilterBarProps {
  filters: {
    services?: string[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  onFilterChange: (filters: Partial<FilterBarProps['filters']>) => void
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const serviceOptions = [
    { id: 'all', label: 'All Services', value: 'all' },
    { id: 'llm', label: 'LLM', value: 'llm' },
    { id: 'image', label: 'Image', value: 'image' },
    { id: 'voice', label: 'Voice', value: 'voice' },
    { id: 'music', label: 'Music', value: 'music' },
    { id: 'video', label: 'Video', value: 'video' },
    { id: 'animation', label: 'Animation', value: 'animation' }
  ]

  const orderOptions = [
    { id: 'desc', label: 'Newest First', value: 'desc' },
    { id: 'asc', label: 'Oldest First', value: 'asc' }
  ]

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Service filter */}
      <div className="flex-1 min-w-[200px]">
        <Select
          value={filters.services?.[0] || 'all'}
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

      {/* Sort order */}
      <div className="flex-1 min-w-[200px]">
        <Select
          value={filters.sortOrder}
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