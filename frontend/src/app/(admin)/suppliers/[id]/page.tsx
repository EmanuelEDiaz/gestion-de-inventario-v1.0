import { SupplierDetailView } from '@/presentation/modules/suppliers/views/SupplierDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="p-6">
      <SupplierDetailView supplierId={id} />
    </div>
  );
}
