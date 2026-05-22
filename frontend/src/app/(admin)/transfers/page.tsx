'use client';

import { useTransfers, TransferTable } from '@/presentation/modules/transfers';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus, RefreshCw } from '@/presentation/shared/components/ui/icon-mapping';

export default function TransfersPage() {
  const { transfers, loading, error, refresh, confirm, ship, complete, cancel, remove } = useTransfers();

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button variant="outline" onClick={refresh} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transferencias</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transferencia
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Transferencias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TransferTable 
              transfers={transfers}
              onConfirm={confirm}
              onShip={ship}
              onComplete={complete}
              onCancel={cancel}
              onDelete={remove}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
