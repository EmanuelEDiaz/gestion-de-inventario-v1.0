import { CustomerDetailView } from '@/presentation/modules/customers/views/CustomerDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="p-6">
      <CustomerDetailView customerId={id} />
    </div>
  );
}
