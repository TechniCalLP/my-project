"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

/**
 * Same look as PaginationNav (src/components/ui/pagination-nav.tsx), but
 * driven by an onPageChange callback instead of URL search params — for
 * components that manage pagination as local state and fetch client-side
 * rather than navigating/re-rendering the page.
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  disabled,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | "...")[] = [1]
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              disabled={disabled || currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="gap-1 pl-2.5 font-thai"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:block">ก่อนหน้า</span>
            </Button>
          </PaginationItem>

          {getPageNumbers().map((page, i) =>
            page === "..." ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <Button
                  variant={currentPage === page ? "outline" : "ghost"}
                  size="icon"
                  disabled={disabled}
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              disabled={disabled || currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="gap-1 pr-2.5 font-thai"
            >
              <span className="hidden sm:block">ถัดไป</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-gray-500 font-thai">
        แสดง {startItem}–{endItem} จาก {totalItems} รายการ
      </p>
    </div>
  )
}
