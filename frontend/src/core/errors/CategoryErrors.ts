export class CategoryNotFoundError extends Error {
  constructor(public readonly categoryId: string) {
    super(`Categoría ${categoryId} no encontrada`);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryInUseError extends Error {
  constructor(public readonly categoryId: string, public readonly categoryName: string) {
    super(`La categoría ${categoryName} está en uso y no puede eliminarse`);
    this.name = 'CategoryInUseError';
  }
}

export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryValidationError';
  }
}
