import { IMovementRepository } from '@/core/movement/ports/IMovementRepository';
import { InventoryMovement, MovementFilter } from '@/core/movement/entities/inventory-movement';
import { getDB } from '@/infrastructure/storage/db';

type CachedMovementRow = {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  reference: string;
  cachedAt: number;
};

function applyFilter(items: CachedMovementRow[], filter?: MovementFilter): CachedMovementRow[] {
  if (!filter) return items;
  return items.filter((m) => {
    if (filter.warehouseId && m.warehouseId !== filter.warehouseId) return false;
    if (filter.productId && m.productId !== filter.productId) return false;
    if (filter.movementType && m.type !== filter.movementType) return false;
    if (filter.sourceDocType && !m.reference.startsWith(filter.sourceDocType)) return false;
    return true;
  });
}

export class MovementRepository implements IMovementRepository {
  async getById(id: string): Promise<InventoryMovement | null> {
    const db = await getDB();
    const cached = (await db.get('movements', id)) as CachedMovementRow | undefined;
    return (cached ?? null) as unknown as InventoryMovement | null;
  }

  async getAll(filter?: MovementFilter): Promise<InventoryMovement[]> {
    const db = await getDB();
    const all = (await db.getAll('movements')) as CachedMovementRow[];
    return applyFilter(all, filter) as unknown as InventoryMovement[];
  }

  async getByWarehouseAndProduct(warehouseId: string, productId: string): Promise<InventoryMovement[]> {
    const db = await getDB();
    const all = (await db.getAll('movements')) as CachedMovementRow[];
    return all.filter((m) => m.warehouseId === warehouseId && m.productId === productId) as unknown as InventoryMovement[];
  }

  async getByDocument(docType: string, docId: string): Promise<InventoryMovement[]> {
    const db = await getDB();
    const all = (await db.getAll('movements')) as CachedMovementRow[];
    return all.filter((m) => m.reference === `${docType}/${docId}`) as unknown as InventoryMovement[];
  }

  async count(filter?: MovementFilter): Promise<number> {
    return applyFilter((await (await getDB()).getAll('movements')) as CachedMovementRow[], filter).length;
  }
}

export const movementRepository = new MovementRepository();
