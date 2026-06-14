import { z } from 'zod';

export const exchangeRateValue = () => z.coerce.number().positive('La tasa debe ser mayor a 0');
export const rateType = z.enum(['OFFICIAL', 'MARKET', 'CUSTOM']);
