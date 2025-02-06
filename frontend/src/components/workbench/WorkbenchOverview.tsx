import { useWorkbench } from '@/lib/hooks/useWorkbench'
import { JobList } from './sections/JobList'
import { FilterBar } from './sections/FilterBar'
import { Pagination } from './sections/Pagination'

export function WorkbenchOverview() {
  const {
    jobs,
    loading,
    error,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange
  } = useWorkbench()

  return (
    <div className="space-y-6">
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
      />
      
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
} 