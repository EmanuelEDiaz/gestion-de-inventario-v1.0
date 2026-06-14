import { isClientError } from '@/infrastructure/api/client';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';

interface OutboxConfig {
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  isTempId?: boolean;
}

export async function tryApiOrOutbox<T>(
  operation: () => Promise<T>,
  config: OutboxConfig,
): Promise<T> {
  const mode = getNetworkMode();
  if (mode === 'online-direct' || mode === 'online-degraded') {
    try {
      return await operation();
    } catch (err) {
      if (isClientError(err)) throw err;
    }
  }

  const isCreate = config.action === 'CREATE';
  const entityId = config.entityId || (isCreate ? crypto.randomUUID() : config.entityId);

  await addToOutbox({
    operationId: crypto.randomUUID(),
    entityType: config.entityType,
    entityId,
    action: config.action,
    payload: config.payload,
  });

  const payload = config.payload;
  const resultPayload = typeof payload === 'object' && payload !== null
    ? { ...payload, id: entityId, isTempId: isCreate }
    : payload;
  return resultPayload as T;
}
