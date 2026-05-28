'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, CircleOff, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useSuppliers } from '../hooks/useSuppliers';
import { SupplierFormFields } from '../components/form/SupplierFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Supplier } from '@/core/supplier/entities/supplier';
import { SupplierRepository } from '@/infrastructure/repositories/supplier/SupplierRepository';
const supplierRepository = new SupplierRepository();
import { statusBadge } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<Supplier>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono text-sm" title="Código del proveedor">{r.code ?? '—'}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span className="font-medium" title="Nombre del proveedor">{r.name}</span> },
  { key: 'contactName', label: 'Contacto', render: (_, r) => <span title="Persona de contacto">{r.contactName ?? '—'}</span> },
  { key: 'phone', label: 'Teléfono', render: (_, r) => <span title="Teléfono del proveedor">{r.phone ?? '—'}</span> },
  { key: 'email', label: 'Email', render: (_, r) => <span title="Correo electrónico">{r.email ?? '—'}</span> },
  {
    key: 'active', label: 'Estado',
    render: (_, r) => (
      <span title={r.active ? 'Proveedor activo' : 'Proveedor inactivo'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.active)}`}>
        {r.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export function SuppliersListView() {
  const { suppliers, loading, error, create, activate, deactivate, remove, fetchAll } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const actions = useMemo<TableAction<Supplier>[]>(() => [
    { icon: CheckCircle, title: 'Activar proveedor', onClick: (r) => activate(r.id), hidden: (r) => r.active },
    { icon: CircleOff, title: 'Desactivar proveedor', onClick: (r) => deactivate(r.id), hidden: (r) => !r.active },
    { icon: Trash2, title: 'Eliminar proveedor', onClick: (r) => remove(r.id) },
  ], [activate, deactivate, remove]);

  const handleDeleteMany = async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} proveedor(es)?`)) return;
    await supplierRepository.deleteAll(ids);
    fetchAll();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Proveedores" description="Gestiona los proveedores del sistema"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo proveedor">+ Nuevo Proveedor</Button>}
      />
      {showForm && (
        <SupplierFormFields
          onSubmit={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Proveedor creado'); setShowForm(false); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear proveedor'); }
            finally { setIsCreating(false); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={suppliers} columns={COLUMNS} actions={actions}
        selectable onDeleteSelected={handleDeleteMany} emptyMessage="No hay proveedores registrados" />
    </div>
  );
}

