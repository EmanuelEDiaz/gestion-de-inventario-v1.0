export interface ProductImage {
  id: string;
  productId: string;
  sortOrder: number;
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename: string | null;
  sizeBytes: number;
  createdAt: string;
}

export interface CreateProductImageData {
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename?: string;
  sizeBytes: number;
  sortOrder: number;
}