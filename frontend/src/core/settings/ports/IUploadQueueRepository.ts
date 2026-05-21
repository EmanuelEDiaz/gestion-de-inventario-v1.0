import type { UploadQueueEntry, CreateUploadQueueEntryData, UploadQueueStatus } from '@/core/settings/entities/upload-queue-entry';

export interface IUploadQueueRepository {
  enqueue(data: CreateUploadQueueEntryData): Promise<UploadQueueEntry>;
  findByStatus(status: UploadQueueStatus): Promise<UploadQueueEntry[]>;
  findByEntity(entityType: string, entityId: string): Promise<UploadQueueEntry[]>;
  updateStatus(id: number, status: UploadQueueStatus, errorMessage?: string): Promise<void>;
  incrementRetry(id: number): Promise<void>;
  remove(id: number): Promise<void>;
  clearCompleted(): Promise<void>;
}
