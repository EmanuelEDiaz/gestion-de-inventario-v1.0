import { z } from 'zod';

const saleLineSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  quantity: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  discount: z.number().min(0).optional(),
});

export const createSaleSchema = z.object({
  warehouseId: z.string().min(1, 'Bodega requerida'),
  customerId: z.string().optional(),
  currencyCode: z.string().optional(),
  notes: z.string().optional(),
  saleDate: z.string().optional(),
  paymentMode: z.enum(['IMMEDIATE', 'CREDIT', 'RESERVE']).optional(),
  lines: z.array(saleLineSchema).min(1, 'Debe tener al menos un producto'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
