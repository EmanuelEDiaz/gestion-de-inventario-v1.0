'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { useRoles } from '../hooks/useRoles';
import { useRoleActions } from '../hooks/useRoleActions';
import { RoleFormFields } from '../components/RoleFormFields';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/user/entities/user';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction, BulkAction } from '@/presentation/shared/components/data-display/GenericTable';
import { statusColors } from '@/presentation/shared/lib/colors';
import { FilterBar } from '@/presentation/shared/components/ui/FilterBar';

const COLUMNS: Column<Role>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <TooltipWrapper content="Código identificador del rol"><span className="font-mono font-medium">{r.code}</span></TooltipWrapper> },
  { key: 'name', label: 'Nombre', render: (_, r) => <TooltipWrapper content="Nombre del rol"><span>{r.name}</span></TooltipWrapper> },
  { key: 'permissions', label: 'Permisos', render: (_, r) => <TooltipWrapper content="Cantidad de permisos asignados"><span>{r.permissions.length}</span></TooltipWrapper> },
  {
    key: 'isSystem', label: 'Tipo',
    render: (_, r) => (
      <TooltipWrapper content={r.isSystem ? 'Rol del sistema (no modificable)' : 'Rol personalizado'}>
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${r.isSystem ? 'bg-purple-100 text-purple-700' : statusColors.info}`}>
          {r.isSystem ? 'Sistema' : 'Personalizado'}
        </span>
      </TooltipWrapper>
    ),
  },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => (
      <TooltipWrapper content={r.isActive ? 'Rol activo' : 'Rol inactivo'}>
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${r.isActive ? statusColors.active : statusColors.inactive}`}>
          {r.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </TooltipWrapper>
    ),
  },
];

export function RolesView() {
  const { data: roles = [], isLoading, error } = useRoles();
  const { create, update, remove, removeMany, isCreating, isUpdating } = useRoleActions();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredRoles = useMemo(() => {
    let result = roles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') result = result.filter(r => r.isActive);
    else if (statusFilter === 'inactive') result = result.filter(r => !r.isActive);
    return result;
  }, [roles, search, statusFilter]);

  const actions = useMemo<TableAction<Role>[]>(() => [
    {
      icon: Pencil, title: 'Editar rol',
      onClick: setEditingRole,
    },
    {
      icon: Trash2, title: 'Eliminar rol',
      confirmMessage: (r) => `¿Estás seguro de eliminar el rol ${r.name}? Esta acción no se puede deshacer.`,
      onClick: (r) => remove(r.id),
      hidden: (r) => r.isSystem,
    },
  ], [remove]);

  const bulkActions = useMemo<BulkAction<Role>[]>(() => [
    {
      label: 'Eliminar seleccionados',
      variant: 'destructive',
      confirmMessage: (count) => `¿Estás seguro de eliminar ${count} rol(es)? Esta acción no se puede deshacer.`,
      onClick: (ids) => removeMany(ids),
    },
  ], [removeMany]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={(error as Error).message} />;

  const handleCreate = async (data: CreateRoleData | UpdateRoleData) => {
    await create(data as CreateRoleData);
    setShowCreate(false);
  };

  const handleUpdate = async (data: CreateRoleData | UpdateRoleData) => {
    if (!editingRole) return;
    await update({ id: editingRole.id, data: data as UpdateRoleData });
    setEditingRole(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Gestiona los roles y permisos del sistema"
        actions={!showCreate && !editingRole && <TooltipWrapper content="Crear nuevo rol"><Button size="sm" onClick={() => setShowCreate(true)}>+ Nuevo Rol</Button></TooltipWrapper>}
      />
      {(showCreate || editingRole) && (
        <RoleFormFields
          initialData={editingRole ?? undefined}
          initialValues={editingRole ? undefined : { code: '', name: '', description: '', permissionIds: [] }}
          onSubmit={editingRole ? handleUpdate : handleCreate}
          isSubmitting={editingRole ? isUpdating : isCreating}
          onCancel={() => { setShowCreate(false); setEditingRole(null); }}
        />
      )}
      {!showCreate && !editingRole && (
        <FilterBar
          searchPlaceholder="Buscar por código, nombre o descripción..."
          onSearch={setSearch}
          filters={[
            {
              key: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ],
              placeholder: 'Todos',
            },
          ]}
          filterValues={{ status: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
          }}
        />
      )}
      <GenericTable
        data={filteredRoles}
        columns={COLUMNS}
        actions={actions}
        selectable
        bulkActions={bulkActions}
        emptyMessage="No hay roles configurados"
      />
    </div>
  );
}
