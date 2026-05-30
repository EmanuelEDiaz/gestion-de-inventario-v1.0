'use client';

import { useMemo, useState } from 'react';
import { Ban, Pencil } from '@/presentation/shared/components/ui/icon-mapping';
import { useRoles } from '../hooks/useRoles';
import { useRoleActions } from '../hooks/useRoleActions';
import { RoleForm } from '../components/RoleForm';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/user/entities/user';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { statusColors } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<Role>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono font-medium" title="Código del rol">{r.code}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span title="Nombre del rol">{r.name}</span> },
  { key: 'permissions', label: 'Permisos', render: (_, r) => <span title="Número de permisos asignados">{r.permissions.length}</span> },
  {
    key: 'isSystem', label: 'Tipo',
    render: (_, r) => (
      <span title={r.isSystem ? 'Rol del sistema (no modificable)' : 'Rol personalizado'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${r.isSystem ? 'bg-purple-100 text-purple-700' : statusColors.info}`}>
        {r.isSystem ? 'Sistema' : 'Personalizado'}
      </span>
    ),
  },
];

export function RolesView() {
  const { data: roles = [], isLoading, error } = useRoles();
  const { create, update, deactivate, isCreating, isUpdating } = useRoleActions();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const actions = useMemo<TableAction<Role>[]>(() => [
    { icon: Pencil, title: 'Editar rol', onClick: setEditingRole, hidden: (r) => r.isSystem },
    { icon: Ban, title: 'Desactivar rol', onClick: (r) => deactivate(r.id), hidden: (r) => r.isSystem || !r.isActive },
  ], [deactivate]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={(error as Error).message} />;

  const handleCreate = async (data: CreateRoleData | UpdateRoleData) => { await create(data as CreateRoleData); setShowCreate(false); };
  const handleUpdate = async (data: CreateRoleData | UpdateRoleData) => {
    if (!editingRole) return;
    await update({ id: editingRole.id, data: data as UpdateRoleData });
    setEditingRole(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Gestiona los roles y permisos del sistema"
        actions={!showCreate && !editingRole && <TooltipWrapper content="Crear nuevo rol"><Button size="sm" onClick={() => setShowCreate(true)} title="Crear nuevo rol">+ Nuevo Rol</Button></TooltipWrapper>}
      />
      {(showCreate || editingRole) && (
        <RoleForm role={editingRole ?? undefined}
          onSubmit={editingRole ? handleUpdate : handleCreate}
          onCancel={() => { setShowCreate(false); setEditingRole(null); }}
          isSubmitting={editingRole ? isUpdating : isCreating}
        />
      )}
      <GenericTable data={roles} columns={COLUMNS} actions={actions} emptyMessage="No hay roles configurados" />
    </div>
  );
}

