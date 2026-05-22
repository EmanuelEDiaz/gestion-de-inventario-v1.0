import type { SvgIcon } from '@/presentation/shared/components/ui/icon-mapping';
import type { TableAction } from '@/presentation/shared/components/data-display/GenericTable';

export interface StatusActionDef<T> {
  icon: SvgIcon;
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
