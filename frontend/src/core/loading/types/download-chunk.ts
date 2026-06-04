export type ChunkStatus = 'pending' | 'downloading' | 'validated' | 'committed' | 'failed' | 'corrupted';

export interface DownloadChunk {
  chunkKey: string;
  entityType: string;
  page: number;
  totalPages: number;
  itemCount: number;
  checksum: string;
  status: ChunkStatus;
  retryCount: number;
  userId: string;
  committedAt?: number;
  failedReason?: string;
}
