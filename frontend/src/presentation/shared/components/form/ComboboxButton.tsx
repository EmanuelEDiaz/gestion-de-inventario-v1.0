'use client';

import { ChevronDown } from '@/presentation/shared/components/ui/icon-mapping';
import { cn } from '@/presentation/shared/lib/utils';

interface ComboboxButtonOption {
  label: string;
}

interface ComboboxButtonProps {
  selectedOption?: ComboboxButtonOption;
  placeholder: string;
  isOpen: boolean;
  disabled: boolean;
  onClick: () => void;
  error?: string;
}

export function ComboboxButton({ selectedOption, placeholder, isOpen, disabled, onClick, error }: ComboboxButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between rounded-lg border px-4 py-2 text-left',
        'focus:outline-none focus:ring-1',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        isOpen && !error && 'border-blue-500 ring-1 ring-blue-500',
        isOpen && error && 'border-red-500 ring-1 ring-red-500'
      )}
    >
      <span className={cn('truncate', !selectedOption && 'text-gray-400')}>
        {selectedOption?.label || placeholder}
      </span>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}
