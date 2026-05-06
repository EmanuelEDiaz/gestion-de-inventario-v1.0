'use client';

import { useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useRoleActions } from '../hooks/useRoleActions';
import { RoleCard } from '../components/RoleCard';
import { RoleForm } from '../components/RoleForm';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/entities/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function RolesView() {
  const { data: roles = [], isLoading, error } = useRoles();
  const { create, update, deactivate, isCreating, isUpdating } = useRoleActions();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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
      {(showCreate || editingRole) && (
        <Card>
          <CardHeader><CardTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</CardTitle></CardHeader>
          <CardContent>
            <RoleForm
              role={editingRole ?? undefined}
              onSubmit={editingRole ? handleUpdate : handleCreate}
              onCancel={() => { setShowCreate(false); setEditingRole(null); }}
              isSubmitting={editingRole ? isUpdating : isCreating}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          {!showCreate && !editingRole && (
            <Button size="sm" onClick={() => setShowCreate(true)} title="Crear nuevo rol">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <RoleCard key={role.id} role={role} onEdit={setEditingRole} onDeactivate={deactivate} />
            ))}
          </div>
          {roles.length === 0 && <p className="text-center text-muted-foreground py-8">No hay roles configurados</p>}
        </CardContent>
      </Card>
    </div>
  );
}
