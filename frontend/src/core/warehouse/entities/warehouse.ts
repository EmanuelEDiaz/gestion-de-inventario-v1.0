/**
 * Warehouse entity - Pure domain model
 */

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseData {
  code: string;
  name: string;
  address?: string | null;
}

export interface UpdateWarehouseData {
  name?: string;
  address?: string | null;
}
