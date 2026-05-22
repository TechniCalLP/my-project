"use client"

import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"

interface PaginationNavProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function PaginationNav({ currentPage, totalPages, totalItems, itemsPerPage }: PaginationNavProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (totalPages <= 1) return null

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) params.delete("page")
    else params.set("page", String(page))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

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
              asChild
              variant="ghost"
              size="default"
              className={cn(
                "gap-1 pl-2.5 font-thai",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            >
              <Link href={buildHref(currentPage - 1)} aria-disabled={currentPage === 1}>
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:block">ก่อนหน้า</span>
              </Link>
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
                  asChild
                  variant={currentPage === page ? "outline" : "ghost"}
                  size="icon"
                >
                  <Link
                    href={buildHref(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </Link>
                </Button>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              asChild
              variant="ghost"
              size="default"
              className={cn(
                "gap-1 pr-2.5 font-thai",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            >
              <Link href={buildHref(currentPage + 1)} aria-disabled={currentPage === totalPages}>
                <span className="hidden sm:block">ถัดไป</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
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
