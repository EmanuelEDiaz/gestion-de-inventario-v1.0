'use client';

import { useCustomers, CustomerTable } from '@/presentation/modules/customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';

export default function CustomersPage() {
  const { customers, loading, error, activate, deactivate, remove } = useCustomers();

  if (loading) {
    return <div className="p-6">Cargando clientes...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTable 
            customers={customers}
            onActivate={activate}
            onDeactivate={deactivate}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
