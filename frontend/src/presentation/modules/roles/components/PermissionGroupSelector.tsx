'use client';

import { useCallback, useMemo } from 'react';
import type { Permission } from '@/core/user/entities/user';
import { PERMISSION_CATEGORY_META } from '../config/permission-categories';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

interface Props {
  allPermissions: Permission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function PermissionGroupSelector({ allPermissions, selectedIds, onChange }: Props) {
  const allIds = useMemo(() => allPermissions.map((p) => p.id), [allPermissions]);
  const isAllSelected = selectedIds.length === allIds.length && allIds.length > 0;

  const toggleAll = useCallback(() => {
    onChange(isAllSelected ? [] : [...allIds]);
  }, [isAllSelected, allIds, onChange]);

  const groups = useMemo(() =>
    allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    }, {}),
    [allPermissions]
  );

  const toggle = useCallback((id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }, [selectedIds, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-2">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          {isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </label>
        <span className="text-xs text-gray-400 tabular-nums">
          {selectedIds.length}/{allIds.length} permisos seleccionados
        </span>
        <TooltipHint
          title="Seleccionar o deseleccionar todos los permisos"
          description="Usa esta opción para habilitar o deshabilitar todos los permisos disponibles de una sola vez."
          variant="info"
          side="right"
        />
      </div>

      <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
        {Object.entries(groups).map(([category, perms]) => {
          const meta = PERMISSION_CATEGORY_META[category];
          const selectedCount = perms.filter((p) => selectedIds.includes(p.id)).length;
          const groupAllSelected = selectedCount === perms.length;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-1">
                {meta?.icon}
                <span className="text-xs font-semibold text-gray-700">{meta?.label ?? category}</span>
                <label className="flex items-center gap-1 ml-auto text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupAllSelected}
                    onChange={() => {
                      const ids = perms.map((p) => p.id);
                      if (groupAllSelected) {
                        onChange(selectedIds.filter((id) => !ids.includes(id)));
                      } else {
                        const existing = selectedIds.filter((id) => !ids.includes(id));
                        onChange([...existing, ...ids]);
                      }
                    }}
                    className="h-3.5 w-3.5"
                  />
                  {groupAllSelected ? 'Quitar grupo' : 'Grupo completo'}
                </label>
                <span className="text-xs text-gray-400 tabular-nums">{selectedCount}/{perms.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {perms.map((p) => (
                  <label key={p.id} className={cn(
                    'flex items-center gap-2 text-sm cursor-pointer rounded px-1.5 py-0.5 transition-colors',
                    selectedIds.includes(p.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs">{p.name}</span>
                    <TooltipHint
                      title={p.code}
                      description={`Permiso: ${p.name}`}
                      variant="info"
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
