'use client';

import { useMutation } from '@tanstack/react-query';
import { exportRepository } from '@/infrastructure/repositories/export/ExportRepository';
import type { ExportFilter } from '@/core/export/ports/IExportRepository';
import { toast } from 'sonner';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useExportController() {
  const exportSalesMutation = useMutation({
    mutationFn: (filter: ExportFilter) => exportRepository.exportSales(filter),
    onSuccess: (blob, variables) => {
      downloadBlob(blob, `ventas.${variables.format}`);
      toast.success('Exportación de ventas completada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const exportInventoryMutation = useMutation({
    mutationFn: (filter: ExportFilter) => exportRepository.exportInventory(filter),
    onSuccess: (blob, variables) => {
      downloadBlob(blob, `inventario.${variables.format}`);
      toast.success('Exportación de inventario completada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { exportSalesMutation, exportInventoryMutation };
}
