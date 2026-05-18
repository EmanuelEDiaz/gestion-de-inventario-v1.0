'use client';

interface PreferenceSectionProps {
  title: string;
  children: React.ReactNode;
  border?: boolean;
}

export function PreferenceSection({ title, children, border = true }: PreferenceSectionProps) {
  return (
    <div className={`space-y-3${border ? ' border-b pb-4' : ''}`}>
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      {children}
    </div>
  );
}
