export interface SupplierImage {
  id: string;
  supplierId: string;
  sortOrder: number;
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename: string | null;
  sizeBytes: number;
  createdAt: string;
}

export interface CreateSupplierImageData {
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename?: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface SetPrimarySupplierImageData {
  imageId: string;
  supplierId: string;
}
