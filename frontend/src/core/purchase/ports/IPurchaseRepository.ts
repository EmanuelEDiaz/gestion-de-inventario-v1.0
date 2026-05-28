import { Purchase, PurchaseFilter, CreatePurchaseInput } from '../entities/purchase';

/**
 * Puerto: Repositorio de Compras
 */
export interface IPurchaseRepository {
  getById(id: string): Promise<Purchase | null>;
  getByNumber(purchaseNumber: string): Promise<Purchase | null>;
  getAll(filter?: PurchaseFilter): Promise<Purchase[]>;
  create(input: CreatePurchaseInput): Promise<Purchase>;
  confirm(id: string): Promise<Purchase>;
  receive(id: string, receivedDate?: string): Promise<Purchase>;
  cancel(id: string): Promise<Purchase>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
}
