export class CustomerNotFoundError extends Error {
  constructor(public readonly customerId: string) {
    super(`Cliente ${customerId} no encontrado`);
    this.name = 'CustomerNotFoundError';
  }
}

export class CustomerDebtLimitExceededError extends Error {
  constructor(
    public readonly customerId: string,
    public readonly limit: number,
    public readonly current: number
  ) {
    super(`Límite de deuda excedido para el cliente ${customerId}: límite ${limit}, actual ${current}`);
    this.name = 'CustomerDebtLimitExceededError';
  }
}
