import { ProductEditView } from '../../../../../presentation/modules/products/views/ProductEditView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="p-6">
      <ProductEditView productId={id} />
    </div>
  );
}