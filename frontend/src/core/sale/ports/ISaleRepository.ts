import { Sale, SaleFilter, CreateSaleInput } from '../entities/sale';

export interface ISaleRepository {
  getById(id: string): Promise<Sale | null>;
  getByNumber(saleNumber: string): Promise<Sale | null>;
  getAll(filter?: SaleFilter): Promise<Sale[]>;
  create(input: CreateSaleInput): Promise<Sale>;
  confirm(id: string): Promise<Sale>;
  deliver(id: string): Promise<Sale>;
  cancel(id: string): Promise<Sale>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
}
