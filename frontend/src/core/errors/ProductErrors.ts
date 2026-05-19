export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductDuplicateError extends Error {
  constructor(public readonly sku: string) {
    super(`Ya existe un producto con SKU ${sku}`);
    this.name = 'ProductDuplicateError';
  }
}

export class ProductOutOfStockError extends Error {
  constructor(
    public readonly productId: string,
    public readonly requested: number,
    public readonly available: number
  ) {
    super(`Stock insuficiente: solicitado ${requested}, disponible ${available}`);
    this.name = 'ProductOutOfStockError';
  }
}

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductValidationError';
  }
}
