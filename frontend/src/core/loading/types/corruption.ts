export type CorruptionStatus = 'pending' | 'repaired' | 'discarded' | 'quarantined';

export interface CorruptionEntry {
  id?: number;
  entityType: string;
  chunkKey: string;
  rawPayload: string;
  parseError: string;
  receivedAt: number;
  status: CorruptionStatus;
  retryCount: number;
  repairedPayload?: string;
  repairedAt?: number;
}
