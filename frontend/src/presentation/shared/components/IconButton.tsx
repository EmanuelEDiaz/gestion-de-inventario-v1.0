'use client';

import { forwardRef, memo } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/presentation/shared/lib/utils';
import { Tooltip } from './ui/tooltip';

interface IconButtonProps {
  icon: LucideIcon;
  title?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
};

const variantClasses = {
  ghost: 'hover:bg-gray-100 text-gray-600',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
  danger: 'hover:bg-danger/5 text-danger',
};

const IconButtonContent = memo(function IconButtonContent({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className,
}: {
  icon: LucideIcon;
  variant?: 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Icon className="h-4 w-4" />
  );
});

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon: Icon, title, onClick, href, variant = 'ghost', size = 'md', className, disabled }, ref) => {
      const button = (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center rounded-md transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
        >
          <IconButtonContent icon={Icon} variant={variant} size={size} />
        </button>
      );

      const content = href ? (
        <Link
          href={href}
          className={cn(
            'inline-flex items-center justify-center rounded-md transition-colors',
            'hover:bg-gray-100 text-gray-600',
            sizeClasses[size]
          )}
        >
          <IconButtonContent icon={Icon} variant={variant} size={size} />
        </Link>
      ) : button;

      if (title) {
        return (
          <Tooltip content={title} delay={400}>
            {content}
          </Tooltip>
        );
      }

      return content;
    }
  )
);

IconButton.displayName = 'IconButton';