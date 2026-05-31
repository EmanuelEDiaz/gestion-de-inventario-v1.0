export type RateType = 'OFFICIAL' | 'MARKET' | 'CUSTOM';

export interface ExchangeRate {
  id: string;
  baseCode: string;
  quoteCode: string;
  rate: number;
  rateType: RateType;
  validFrom: string;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateExchangeRateInput {
  baseCode: string;
  quoteCode: string;
  rate: number;
  rateType: RateType;
  validFrom: string;
}

export interface UpdateExchangeRateInput {
  rate: number;
  rateType: RateType;
  validFrom: string;
}

export interface ExchangeRateFilter {
  baseCode?: string;
  quoteCode?: string;
  rateType?: RateType;
}

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  OFFICIAL: 'Oficial',
  MARKET: 'Mercado',
  CUSTOM: 'Personalizada',
};
