export class WarehouseNotFoundError extends Error {
  constructor(public readonly warehouseId: string) {
    super(`Almacén ${warehouseId} no encontrado`);
    this.name = 'WarehouseNotFoundError';
  }
}

export class WarehouseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WarehouseValidationError';
  }
}
