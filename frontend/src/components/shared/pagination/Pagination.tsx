import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const showEllipsis = totalPages > 7

  const getVisiblePages = () => {
    if (!showEllipsis) return pages

    if (currentPage <= 4) {
      return [...pages.slice(0, 5), '...', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', ...pages.slice(totalPages - 5)]
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ]
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex gap-2">
        {getVisiblePages().map((page, index) => {
          if (page === '...') {
            return (
              <div 
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9 text-muted-foreground"
              >
                ...
              </div>
            )
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className={`w-9 h-9 p-0 ${
                currentPage === page 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-sm"
                  : "hover:bg-muted"
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
} 