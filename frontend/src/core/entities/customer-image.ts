export interface CustomerImage {
  id: string;
  customerId: string;
  sortOrder: number;
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename: string | null;
  sizeBytes: number;
  createdAt: string;
}

export interface CreateCustomerImageData {
  isPrimary: boolean;
  contentType: string;
  filePath: string;
  originalFilename?: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface SetPrimaryCustomerImageData {
  imageId: string;
  customerId: string;
}
