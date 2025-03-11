import { FilterBar } from '@/components/shared/filters/FilterBar';

interface VideoListHeaderProps {
  sortBy: 'newest' | 'oldest';
  onSortChange: (value: 'newest' | 'oldest') => void;
}

export function VideoListHeader({
  sortBy,
  onSortChange
}: VideoListHeaderProps) {
  const handleFilterChange = (filters: Partial<{
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>) => {
    // Handle sort order
    if (filters.sortOrder) {
      onSortChange(filters.sortOrder === 'desc' ? 'newest' : 'oldest');
    }
  };

  return (
    <FilterBar
      onFilterChange={handleFilterChange}
      showServiceFilter={false}
    />
  );
} 