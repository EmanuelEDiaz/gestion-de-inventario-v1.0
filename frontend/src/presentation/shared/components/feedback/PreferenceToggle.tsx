'use client';

import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import type { TooltipHintProps } from '@/presentation/shared/components/ui/tooltip';

interface PreferenceToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  hintDescription?: string;
  hintVariant?: TooltipHintProps['variant'];
}

export function PreferenceToggle({
  checked, onChange, disabled, label,
  hint, hintDescription, hintVariant = 'info',
}: PreferenceToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-primary rounded disabled:opacity-50"
      />
      <span className="flex items-center gap-1 text-sm text-gray-700">
        {label}
        {hint && <TooltipHint title={hint} description={hintDescription} variant={hintVariant} />}
      </span>
    </label>
  );
}
