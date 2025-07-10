import { useWorkbench } from '@/lib/hooks/useWorkbench'
import { FilterBar } from '@/components/shared/filters/FilterBar'
import { Pagination } from '@/components/shared/pagination/Pagination'
import { WorkbenchEmpty } from './sections/WorkbenchEmpty'
import { Skeleton } from '@/components/ui/skeleton'
import { JobCard } from './sections/JobCard'

export function WorkbenchOverview() {
  const {
    jobs,
    loading,
    error,
    pagination,
    handleFilterChange,
    handlePageChange,
  } = useWorkbench()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    // You can create a more specific error component if needed
    return <WorkbenchEmpty />
  }

  // Show empty state if filters are applied and no jobs are found, or if there are no jobs at all.
  if (!jobs || jobs.length === 0) {
    return (
      <div className="space-y-6">
        <FilterBar onFilterChange={handleFilterChange} />
        <WorkbenchEmpty />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FilterBar
        onFilterChange={handleFilterChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {jobs.map(job => (
          <JobCard key={job.job_id} job={job} />
        ))}
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
} 