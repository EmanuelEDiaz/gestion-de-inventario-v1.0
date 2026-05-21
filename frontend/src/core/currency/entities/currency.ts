export interface Currency {
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
}

export interface CreateCurrencyInput {
  code: string;
  name: string;
  symbol?: string;
}

export interface UpdateCurrencyInput {
  name?: string;
  symbol?: string;
  isActive?: boolean;
}
