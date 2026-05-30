'use client';

import type { Permission } from '@/core/user/entities/user';
import { PERMISSION_CATEGORY_META } from '../config/permission-categories';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';

interface Props {
  allPermissions: Permission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function PermissionGroupSelector({ allPermissions, selectedIds, onChange }: Props) {
  const groups = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
      {Object.entries(groups).map(([category, perms]) => {
        const meta = PERMISSION_CATEGORY_META[category];
        const selectedCount = perms.filter((p) => selectedIds.includes(p.id)).length;

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-1">
              {meta?.icon}
              <span className="text-xs font-semibold text-gray-700">{meta?.label ?? category}</span>
              <label className="flex items-center gap-1 ml-auto text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCount === perms.length}
                  onChange={() => {
                    const ids = perms.map((p) => p.id);
                    const allSelected = ids.every((id) => selectedIds.includes(id));
                    if (allSelected) {
                      onChange(selectedIds.filter((id) => !ids.includes(id)));
                    } else {
                      const existing = selectedIds.filter((id) => !ids.includes(id));
                      onChange([...existing, ...ids]);
                    }
                  }}
                  className="h-3.5 w-3.5"
                />
                Seleccionar todos
              </label>
              <span className="text-xs text-gray-400 tabular-nums">{selectedCount}/{perms.length} seleccionados</span>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {perms.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer" title={p.name}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4"
                  />
                  {p.name}
                  <TooltipHint title={p.code} variant="info" />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
