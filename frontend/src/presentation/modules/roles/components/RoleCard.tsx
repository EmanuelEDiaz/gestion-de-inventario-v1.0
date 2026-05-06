'use client';

import type { Role } from '@/core/entities/user';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Pencil, Ban } from 'lucide-react';

interface Props {
  role: Role;
  onEdit: (role: Role) => void;
  onDeactivate: (id: string) => void;
}

export function RoleCard({ role, onEdit, onDeactivate }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{role.name}</span>
            {role.isSystem && <Badge variant="secondary">Sistema</Badge>}
            {!role.isActive && <Badge variant="destructive">Inactivo</Badge>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{role.code}</p>
          {role.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{role.description}</p>}
          <p className="text-xs text-gray-400 mt-2">{role.permissions.length} permiso(s)</p>
        </div>
        {!role.isSystem && (
          <div className="flex gap-1 shrink-0">
            <TooltipWrapper content="Editar rol">
              <Button variant="ghost" size="sm" onClick={() => onEdit(role)} title="Editar rol">
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            {role.isActive && (
              <TooltipWrapper content="Desactivar rol">
                <Button variant="ghost" size="sm" onClick={() => onDeactivate(role.id)} title="Desactivar rol">
                  <Ban className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipWrapper>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
