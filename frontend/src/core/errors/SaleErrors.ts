export class SaleNotFoundError extends Error {
  constructor(public readonly saleId: string) {
    super(`Venta ${saleId} no encontrada`);
    this.name = 'SaleNotFoundError';
  }
}

export class SaleNotEditableError extends Error {
  constructor(public readonly saleId: string, public readonly status: string) {
    super(`La venta ${saleId} no se puede editar en estado ${status}`);
    this.name = 'SaleNotEditableError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly requested: number,
    public readonly available: number
  ) {
    super(`Stock insuficiente para ${productName}: solicitado ${requested}, disponible ${available}`);
    this.name = 'InsufficientStockError';
  }
}
