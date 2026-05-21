import type { LucideIcon } from 'lucide-react';
import type { TableAction } from '@/presentation/shared/components/data-display/GenericTable';

export interface StatusActionDef<T> {
  icon: LucideIcon;
  label: string;
  onClick?: (row: T) => void;
}

export function useStatusActions<T extends { id: string }>(
  configs: StatusActionDef<T>[]
): TableAction<T>[] {
  return configs.map(c => ({
    icon: c.icon,
    title: c.label,
    onClick: c.onClick,
    hidden: () => !c.onClick,
  }));
}
