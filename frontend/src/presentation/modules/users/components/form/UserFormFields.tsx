'use client';

import { useState, useMemo, useCallback } from 'react';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { createUserSchema, updateUserSchema } from '@/core/validators/core/user-validators';
import { useRoles } from '@/presentation/modules/roles/hooks/useRoles';
import { Input } from '@/presentation/shared/components/ui/Input';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import type { CreateUserData } from '@/core/user/entities/user';

const FIELDS: EntityFormField[] = [
  { name: 'username', label: 'Usuario', type: 'text', required: true, placeholder: 'Ej: juanperez' },
  { name: 'displayName', label: 'Nombre Completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez' },
  { name: 'email', label: 'Email (opcional)', type: 'text', required: false, placeholder: 'Ej: juan@empresa.com' },
  { name: 'password', label: 'Contraseña', type: 'text', required: true, placeholder: '••••••••' },
  { name: 'roleId', label: 'Rol', type: 'select', required: true },
];

const INITIAL_VALUES: Record<string, string> = {
  username: '',
  displayName: '',
  email: '',
  password: '',
  roleId: '',
};

interface UserFormFieldsProps {
  initialData?: CreateUserData;
  initialValues?: Record<string, unknown>;
  storageKey: string;
  isEditing?: boolean;
  persistCreateValues?: boolean;
  onSubmit: (data: CreateUserData) => Promise<void>;
  onCancel: () => void;
}

export function UserFormFields({
  initialData, initialValues, storageKey, isEditing,
  persistCreateValues, onSubmit, onCancel,
}: UserFormFieldsProps) {
  const { data: roles = [], isLoading: loadingRoles } = useRoles();

  const mergedInitial = useMemo(() => {
    const base = { ...INITIAL_VALUES };
    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        if (value != null && key in INITIAL_VALUES) {
          base[key as keyof typeof INITIAL_VALUES] = String(value);
        }
      }
    }
    if (initialValues) {
      for (const [key, value] of Object.entries(initialValues)) {
        if (value != null && key in INITIAL_VALUES) {
          base[key as keyof typeof INITIAL_VALUES] = String(value);
        }
      }
    }
    return base;
  }, [initialData, initialValues]);

  const [username, setUsername] = useState(mergedInitial.username);
  const [displayName, setDisplayName] = useState(mergedInitial.displayName);
  const [email, setEmail] = useState(mergedInitial.email);
  const [password, setPassword] = useState(mergedInitial.password);
  const [roleId, setRoleId] = useState(mergedInitial.roleId);

  const values: Record<string, string> = useMemo(() => ({
    username, displayName, email, password, roleId,
  }), [username, displayName, email, password, roleId]);

  const onChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      username: setUsername,
      displayName: setDisplayName,
      email: setEmail,
      password: setPassword,
      roleId: setRoleId,
    };
    setters[field]?.(value);
  }, []);

  const handleSubmitAction = useCallback(async (formValues: Record<string, string>) => {
    await onSubmit({
      username: formValues.username,
      displayName: formValues.displayName,
      email: formValues.email || undefined,
      password: formValues.password,
      roleId: formValues.roleId,
    });
  }, [onSubmit]);

  return (
    <EntityForm
      title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
      description={isEditing ? 'Modifica los datos del usuario' : 'Completa los datos del usuario'}
      fields={FIELDS}
      values={values}
      onChange={onChange}
      onSubmitAction={handleSubmitAction}
      onCancel={onCancel}
      isEditing={isEditing}
      createSchema={createUserSchema}
      updateSchema={updateUserSchema}
      storageKey={storageKey}
      persistCreateValues={persistCreateValues}
      initialValues={initialValues}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Creando...'}
      renderField={({ field, value, fieldError, onChange: onValueChange, defaultRender }) => {
        if (field.name === 'roleId') {
          return (
            <div className="space-y-1">
              <label htmlFor="roleId" className="text-sm font-medium">
                <span className="inline-flex items-center gap-1">Rol<TooltipHint title="Rol" description="Define los permisos del usuario en el sistema" /></span>
              </label>
              <select
                id="roleId"
                value={value}
                onChange={(e) => onValueChange(field.name, e.target.value)}
                required
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${fieldError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                <option value="" disabled>{loadingRoles ? 'Cargando roles...' : 'Seleccionar rol'}</option>
                {roles.filter((r) => r.isActive).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            </div>
          );
        }
        if (field.name === 'password') {
          return (
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                <span className="inline-flex items-center gap-1">Contraseña<TooltipHint title="Contraseña" description="Mínimo 8 caracteres" /></span>
              </label>
              <Input
                id="password" type="password"
                value={value}
                onChange={(e) => onValueChange(field.name, e.target.value)}
                placeholder="••••••••" required title="Contraseña de al menos 8 caracteres"
              />
              {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            </div>
          );
        }
        return defaultRender(field);
      }}
    />
  );
}
