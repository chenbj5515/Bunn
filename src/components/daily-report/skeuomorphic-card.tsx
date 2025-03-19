'use client'

import { cn } from "@/lib/utils"

interface SkeuomorphicCardProps {
  children: React.ReactNode
  className?: string
}

export function SkeuomorphicCard({ children, className }: SkeuomorphicCardProps) {
  return (
    <div 
      className={cn(
        "relative bg-white dark:bg-black rounded-2xl p-6",
        "border border-gray-100 dark:border-gray-800",
        className
      )}
    >
      {children}
    </div>
  )
}