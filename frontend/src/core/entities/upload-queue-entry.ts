export type UploadQueueStatus = 'PENDING' | 'UPLOADING' | 'DONE' | 'FAILED';

export type UploadQueueEntityType = 'CUSTOMER_IMAGE' | 'SUPPLIER_IMAGE';

export interface UploadQueueEntry {
  /** ID local (auto-incremental en IndexedDB) */
  id?: number;
  entityType: UploadQueueEntityType;
  entityId: string;
  localFileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  sortOrder: number;
  isPrimary: boolean;
  status: UploadQueueStatus;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateUploadQueueEntryData {
  entityType: UploadQueueEntityType;
  entityId: string;
  localFileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  isPrimary: boolean;
}
