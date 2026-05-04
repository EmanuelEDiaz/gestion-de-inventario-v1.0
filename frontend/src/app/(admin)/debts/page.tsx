import { DebtsListView } from '@/presentation/modules/debts/views/DebtsListView';

export const metadata = {
  title: 'Deudas — Inventario',
};

export default function DebtsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Deudas</h1>
      <DebtsListView />
    </div>
  );
}
