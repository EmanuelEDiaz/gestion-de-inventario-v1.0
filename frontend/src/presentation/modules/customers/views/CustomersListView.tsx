'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, CircleOff, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerFormFields } from '../components/form/CustomerFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Customer } from '@/core/customer/entities/customer';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
const customerRepository = new CustomerRepository();
import { statusBadge } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<Customer>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono text-sm" title="Código del cliente">{r.code ?? '—'}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span className="font-medium" title="Nombre del cliente">{r.name}</span> },
  { key: 'contactName', label: 'Contacto', render: (_, r) => <span title="Persona de contacto">{r.contactName ?? '—'}</span> },
  { key: 'phone', label: 'Teléfono', render: (_, r) => <span title="Teléfono">{r.phone ?? '—'}</span> },
  { key: 'email', label: 'Email', render: (_, r) => <span title="Correo electrónico">{r.email ?? '—'}</span> },
  {
    key: 'active', label: 'Estado',
    render: (_, r) => (
      <span title={r.active ? 'Cliente activo' : 'Cliente inactivo'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.active)}`}>
        {r.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export function CustomersListView() {
  const { customers, loading, error, create, activate, deactivate, remove, fetchAll } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const actions = useMemo<TableAction<Customer>[]>(() => [
    { icon: CheckCircle, title: 'Activar cliente', onClick: (r) => activate(r.id), hidden: (r) => r.active },
    { icon: CircleOff, title: 'Desactivar cliente', onClick: (r) => deactivate(r.id), hidden: (r) => !r.active },
    { icon: Trash2, title: 'Eliminar cliente', onClick: (r) => remove(r.id) },
  ], [activate, deactivate, remove]);

  const handleDeleteMany = async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} cliente(s)?`)) return;
    await customerRepository.deleteAll(ids);
    fetchAll();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestiona los clientes del sistema"
        actions={!showForm && <TooltipWrapper content="Crear nuevo cliente"><Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo cliente">+ Nuevo Cliente</Button></TooltipWrapper>}
      />
      {showForm && (
        <CustomerFormFields
          onSubmit={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Cliente creado'); setShowForm(false); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear cliente'); }
            finally { setIsCreating(false); }
          }}
          onContinue={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Cliente creado. Puedes seguir agregando.'); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear cliente'); }
            finally { setIsCreating(false); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={customers} columns={COLUMNS} actions={actions}
        selectable onDeleteSelected={handleDeleteMany} emptyMessage="No hay clientes registrados" />
    </div>
  );
}

