'use client';

import type { Permission } from '@/core/user/entities/user';

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
      {Object.entries(groups).map(([category, perms]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</p>
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
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
