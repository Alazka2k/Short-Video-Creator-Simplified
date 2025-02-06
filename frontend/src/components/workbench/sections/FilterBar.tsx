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

  const sortOptions = [
    { id: 'created_at', label: 'Creation Date', value: 'created_at' },
    { id: 'updated_at', label: 'Last Updated', value: 'updated_at' }
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

      {/* Sort by */}
      <div className="flex-1 min-w-[200px]">
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
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
            onFilterChange({ sortOrder: value as 'asc' | 'desc' })
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