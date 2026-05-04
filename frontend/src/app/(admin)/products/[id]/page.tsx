import { ProductDetailView } from '../../../../presentation/modules/products/views/ProductDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="p-6">
      <ProductDetailView productId={id} />
    </div>
  );
}