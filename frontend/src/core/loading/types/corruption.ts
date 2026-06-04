export type CorruptionStatus = 'pending' | 'repaired' | 'discarded';

export interface CorruptionEntry {
  id?: number;
  entityType: string;
  chunkKey: string;
  rawPayload: string;
  parseError: string;
  receivedAt: number;
  status: CorruptionStatus;
  repairedPayload?: string;
  repairedAt?: number;
}
