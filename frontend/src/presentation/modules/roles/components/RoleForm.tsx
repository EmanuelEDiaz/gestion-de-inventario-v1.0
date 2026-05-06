'use client';

import { useState } from 'react';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/entities/user';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { PermissionGroupSelector } from './PermissionGroupSelector';
import { usePermissions } from '../hooks/usePermissions';

interface Props {
  role?: Role;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function RoleForm({ role, onSubmit, onCancel, isSubmitting }: Props) {
  const { data: allPerms = [] } = usePermissions();
  const [name, setName] = useState(role?.name ?? '');
  const [code, setCode] = useState(role?.code ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    role?.permissions.map((p) => p.id) ?? []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      await onSubmit({ code: code.toUpperCase(), name, description: description || undefined, permissionIds: selectedIds });
    } else {
      await onSubmit({ name, description: description || undefined, permissionIds: selectedIds });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!role && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Código</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CUSTOM_ROLE" required title="Solo mayúsculas y guiones bajos. Ej: CUSTOM_ROLE" />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium">Nombre</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del rol" required title="Nombre legible del rol" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Descripción (opcional)</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve del rol" title="Descripción corta del rol" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Permisos</label>
        <PermissionGroupSelector allPermissions={allPerms} selectedIds={selectedIds} onChange={setSelectedIds} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (role ? 'Guardar cambios' : 'Crear Rol')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} title="Cancelar">Cancelar</Button>
      </div>
    </form>
  );
}
