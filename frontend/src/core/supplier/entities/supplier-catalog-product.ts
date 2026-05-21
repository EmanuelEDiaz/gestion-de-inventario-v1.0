export interface SupplierCatalogProduct {
  id: string;
  supplierId: string;
  /** null cuando el producto no está vinculado al catálogo interno */
  productId: string | null;
  description: string | null;
  unitPrice: number | null;
  currencyCode: string | null;
}

export interface AddSupplierCatalogProductData {
  productId?: string;
  description?: string;
  unitPrice?: number;
  currencyCode?: string;
}
