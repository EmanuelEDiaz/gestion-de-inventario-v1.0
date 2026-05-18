'use client';

interface SystemSettingsFieldsProps {
  updatedAt: string | null;
  version: number;
}

export function SystemSettingsFields({ updatedAt, version }: SystemSettingsFieldsProps) {
  if (!updatedAt) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Última actualización: {new Date(updatedAt).toLocaleString()} · versión {version}
    </p>
  );
}
