'use client';

interface PreferenceToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}

export function PreferenceToggle({ checked, onChange, disabled, label }: PreferenceToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-primary rounded disabled:opacity-50"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
