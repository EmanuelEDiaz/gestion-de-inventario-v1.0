'use client';

import { ChevronLeft, ChevronRight } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

function DoubleChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 17L6 12L11 7" />
      <path d="M18 17L13 12L18 7" />
    </svg>
  );
}

function DoubleChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 7L18 12L13 17" />
      <path d="M6 7L11 12L6 17" />
    </svg>
  );
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

export function PaginationControls({ page, totalPages, totalElements, onPageChange, pageSize }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
      <span className="text-sm text-muted-foreground">
        {startItem}-{endItem} de {totalElements}
      </span>
      <div className="flex items-center gap-1">
        <TooltipWrapper content="Primera página">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(0)} className="h-8 w-8 p-0">
            <DoubleChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Página anterior">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
        <div className="flex items-center gap-1 px-2">
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn('h-8 min-w-[32px] px-2', p === page && 'pointer-events-none')}
              >
                {p + 1}
              </Button>
            )
          )}
        </div>
        <TooltipWrapper content="Página siguiente">
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Última página">
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(totalPages - 1)} className="h-8 w-8 p-0">
            <DoubleChevronRight className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: number[] = [];
  pages.push(0);

  if (current > 2) pages.push(-1);

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 3) pages.push(-1);

  pages.push(total - 1);

  return pages;
}
