import { PosView } from '@/presentation/modules/pos/views/PosView';

export const metadata = {
  title: 'Punto de Venta — Inventario',
};

export default function PosPage() {
  return (
    <div className="p-4 h-full">
      <h1 className="text-xl font-bold mb-4">Punto de Venta</h1>
      <PosView />
    </div>
  );
}
