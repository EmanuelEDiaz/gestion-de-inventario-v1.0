'use client';

import type { ReactNode } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

interface DetailFieldProps {
  label: string;
  value: ReactNode;
  tooltip?: string;
  className?: string;
  labelWidth?: string;
}

export function DetailField({ label, value, tooltip, className, labelWidth }: DetailFieldProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <dt className="flex items-center gap-1 text-xs text-gray-500">
        {tooltip ? (
          <TooltipWrapper content={tooltip}>
            <span className="cursor-help">{label}</span>
          </TooltipWrapper>
        ) : (
          <span>{label}</span>
        )}
      </dt>
      <dd className={cn('text-sm font-medium text-gray-900', labelWidth)}>{value ?? <span className="text-gray-400 italic">—</span>}</dd>
    </div>
  );
}
