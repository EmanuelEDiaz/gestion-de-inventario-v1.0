'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Role, CreateRoleData, UpdateRoleData } from '@/core/user/entities/user';
import { EntityForm } from '@/presentation/shared/components/form/EntityForm';
import { PermissionGroupSelector } from './PermissionGroupSelector';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { usePermissions } from '../hooks/usePermissions';
import { createRoleSchema, updateRoleSchema } from '@/core/validators/role-validators';

interface RoleFormFieldsProps {
  initialData?: Role;
  initialValues?: Partial<CreateRoleData>;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => void;
  onCancel: () => void;
}

export function RoleFormFields({ initialData, initialValues, onSubmit, onCancel }: RoleFormFieldsProps) {
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
      hintDescription: 'Solo mayúsculas, números y guiones bajos. Se usa internamente para verificar permisos. No se puede modificar después de crear el rol.',
    },
    {
      name: 'name', label: 'Nombre', type: 'text' as const, required: true,
      placeholder: 'Rol personalizado',
      hint: 'Nombre legible del rol',
      hintDescription: 'Nombre visible para los usuarios. Se muestra en listados, filtros y perfiles.',
    },
    {
      name: 'description', label: 'Descripción', type: 'text' as const,
      placeholder: 'Descripción breve del rol',
      hint: 'Descripción opcional del rol',
      hintDescription: 'Texto breve que explica el propósito del rol. Máximo 200 caracteres.',
    },
  ], [isEditing]);

  const handleSubmit = useCallback(async (formValues: Record<string, string>) => {
    if (!isEditing) {
      try { localStorage.setItem('role-create-permissions', JSON.stringify(selectedPermIds)); } catch {}
      await onSubmit({
        code: formValues.code.toUpperCase(),
        name: formValues.name,
        description: formValues.description || undefined,
        permissionIds: selectedPermIds,
      } satisfies CreateRoleData);
    } else {
      await onSubmit({
        name: formValues.name,
        description: formValues.description || undefined,
        permissionIds: selectedPermIds,
      } satisfies UpdateRoleData);
    }
  }, [isEditing, selectedPermIds, onSubmit]);

  return (
    <EntityForm
      title={isEditing ? 'Editar Rol' : 'Nuevo Rol'}
      description={isEditing ? 'Modifica los datos del rol' : 'Crea un nuevo rol con permisos personalizados'}
      fields={fieldConfigs}
      values={values}
      onChange={onChange}
      onSubmitAction={handleSubmit}
      onCancel={onCancel}
      isEditing={isEditing}
      createSchema={createRoleSchema}
      updateSchema={updateRoleSchema}
      submitLabel={isEditing ? 'Actualizar Rol' : 'Crear Rol'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
      initialValues={isEditing ? undefined : initialValues}
      storageKey="role-create"
      afterFields={
        <div className="space-y-1">
          <label className="text-sm font-medium">
            <span className="inline-flex items-center gap-1">
              Permisos
              <TooltipHint
                title="Selección de permisos"
                description="Define los permisos específicos que tendrá este rol. Los permisos están agrupados por categoría para facilitar su gestión."
              />
            </span>
          </label>
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
