import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface AspectRatioContainerProps {
  aspectRatio?: string
  children: ReactNode
  className?: string
}

export function AspectRatioContainer({
  aspectRatio = "16:9",
  children,
  className = ""
}: AspectRatioContainerProps) {
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "aspect-video" // 16:9
      case "1:1":
        return "aspect-square" // 1:1
      case "9:16":
        return "aspect-[9/16]" // 9:16
      default:
        return "aspect-video" // Default to 16:9
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-muted",
      getAspectRatioClass(aspectRatio),
      className
    )}>
      {children}
    </div>
  )
} 