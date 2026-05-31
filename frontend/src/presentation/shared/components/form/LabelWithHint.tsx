'use client';

import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import type { TooltipHintProps } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

export interface LabelWithHintProps {
  label: string;
  hint?: string;
  hintDescription?: string;
  hintVariant?: TooltipHintProps['variant'];
  hintSide?: TooltipHintProps['side'];
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function LabelWithHint({
  label,
  hint,
  hintDescription,
  hintVariant = 'info',
  hintSide = 'right',
  htmlFor,
  required,
  className,
}: LabelWithHintProps) {
  const Tag = htmlFor ? 'label' : 'p';

  return (
    <Tag htmlFor={htmlFor} className={cn('text-sm font-medium', className)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <TooltipHint title={hint} description={hintDescription} variant={hintVariant} side={hintSide} />}
      </span>
    </Tag>
  );
}
