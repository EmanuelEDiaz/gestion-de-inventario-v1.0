'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/user/entities/user';
import { EntityForm } from '@/presentation/shared/components/form/EntityForm';
import { PermissionGroupSelector } from './PermissionGroupSelector';
import { usePermissions } from '../hooks/usePermissions';

interface RoleFormFieldsProps {
  initialData?: Role;
  initialValues?: Partial<CreateRoleData>;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function RoleFormFields({ initialData, initialValues, onSubmit, isSubmitting, onCancel }: RoleFormFieldsProps) {
  const { data: allPerms = [] } = usePermissions();
  const isEditing = !!initialData;

  const [code, setCode] = useState(initialData?.code ?? initialValues?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? initialValues?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? initialValues?.description ?? '');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>(
    initialData?.permissions.map((p) => p.id) ?? initialValues?.permissionIds ?? []
  );

  const prefillPermsRef = useRef(false);

  useEffect(() => {
    if (isEditing) return;
    if (prefillPermsRef.current) return;
    try {
      const saved = localStorage.getItem('role-create-permissions');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (parsed.length > 0) {
          setSelectedPermIds(parsed);
          prefillPermsRef.current = true;
          return;
        }
      }
    } catch {}
    if (allPerms.length > 0) {
      setSelectedPermIds(allPerms.map((p) => p.id));
      prefillPermsRef.current = true;
    }
  }, [isEditing, allPerms]);

  const values = { code, name, description };
  const onChange = (field: string, value: string) => {
    if (field === 'code') setCode(value.toUpperCase());
    else if (field === 'name') setName(value);
    else if (field === 'description') setDescription(value);
  };

  const fieldConfigs = useMemo(() => [
    {
      name: 'code', label: 'Código', type: 'text' as const, required: true,
      placeholder: 'CUSTOM_ROLE', maxLength: 50, disabled: isEditing,
      hint: 'Identificador único del rol',
      hintDescription: 'Solo mayúsculas, números y guiones bajos. No se puede modificar después de crear.',
    },
    {
      name: 'name', label: 'Nombre', type: 'text' as const, required: true,
      placeholder: 'Rol personalizado',
      hint: 'Nombre legible del rol',
    },
    {
      name: 'description', label: 'Descripción', type: 'text' as const,
      placeholder: 'Descripción breve del rol',
      hint: 'Descripción opcional del rol',
    },
  ], [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) {
      try { localStorage.setItem('role-create-permissions', JSON.stringify(selectedPermIds)); } catch {}
      onSubmit({ code: code.toUpperCase(), name, description: description || undefined, permissionIds: selectedPermIds } satisfies CreateRoleData);
    } else {
      onSubmit({ name, description: description || undefined, permissionIds: selectedPermIds } satisfies UpdateRoleData);
    }
  };

  return (
    <EntityForm
      title={isEditing ? 'Editar Rol' : 'Nuevo Rol'}
      description={isEditing ? 'Modifica los datos del rol' : 'Crea un nuevo rol con permisos personalizados'}
      fields={fieldConfigs}
      values={values}
      onChange={onChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      isEditing={isEditing}
      submitLabel={isEditing ? 'Actualizar Rol' : 'Crear Rol'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
      initialValues={isEditing ? undefined : initialValues}
      storageKey="role-create"
      afterFields={
        <div className="space-y-1">
          <label className="text-sm font-medium">Permisos</label>
          <PermissionGroupSelector
            allPermissions={allPerms}
            selectedIds={selectedPermIds}
            onChange={setSelectedPermIds}
          />
        </div>
      }
    />
  );
}
