'use client';

import { useSuppliers, SupplierTable } from '@/presentation/modules/suppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';

export default function SuppliersPage() {
  const { suppliers, loading, error, activate, deactivate, remove } = useSuppliers();

  if (loading) {
    return <div className="p-6">Cargando proveedores...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Proveedores</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierTable 
            suppliers={suppliers}
            onActivate={activate}
            onDeactivate={deactivate}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
