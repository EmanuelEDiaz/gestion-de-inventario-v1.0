'use client';

/**
 * Products list page - Simple wrapper for ProductsListView
 * Pages should only import and render views
 */

import { ProductsListView } from '@/presentation/modules/products/views/ProductsListView';

export default function ProductsPage() {
  return <ProductsListView />;
}
