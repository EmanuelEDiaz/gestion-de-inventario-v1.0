/**
 * ProductCacheService - PERSISTENCIA OFFLINE DE PRODUCTOS (COMMENTED)
 * =========================================================================
 * 
 * Este servicio provee caché offline para productos usando IndexedDB.
 * NO ESTÁ ACTIVO - código comentado esperando implementación.
 * 
 * PARA ACTIVAR:
 * 1. Descomentar las funciones
 * 2. Integrar con ProductRepository.getAllWithCursor()
 * 3. Agregar tabla 'products' en db.ts
 * 
 * =========================================================================
 */

// import { getDB } from './db';
// import type { Product } from '@/core/entities/product';

/**
 * Interface para productos cacheados
 */
// interface CachedProduct {
//   id: string;
//   sku: string | null;
//   barcode: string | null;
//   name: string;
//   description: string | null;
//   categoryId: string | null;
//   categoryName: string | null;
//   status: string;
//   costMethod: string;
//   standardCost: number | null;
//   salePrice: number | null;
//   taxRate: number;
//   reorderPoint: number | null;
//   unitOfMeasure: string;
//   createdAt: string;
//   updatedAt: string;
//   cachedAt: number;  // Timestamp de cuando se guardó
// }

/**
 * ProductCacheService - Métodos para gestionar caché offline de productos
 * =========================================================================
 * UBICACIÓN:很容易 encontrar en infrastructure/storage/ProductCacheService.ts
 * MODIFICAR: Solo cambiar aquí para ajustar lógica de cache
 * =========================================================================
 */
// export const productCache = {
//   /**
//    * Guarda productos en el cache offline
//    * @param products Lista de productos a guardar
//    */
//   async saveProducts(products: Product[]): Promise<void> {
//     const db = await getDB();
//     const tx = db.transaction('products', 'readwrite');
//     const store = tx.objectStore('products');
//     
//     const now = Date.now();
//     for (const product of products) {
//       await store.put({
//         ...product,
//         cachedAt: now,
//       });
//     }
//     
//     await tx.done;
//   },

//   /**
//    * Obtiene todos los productos del cache offline
//    * @returns Lista de productos cacheados
//    */
//   async getAllProducts(): Promise<Product[]> {
//     const db = await getDB();
//     const products = await db.getAll('products');
//     return products.map(p => ({
//       id: p.id,
//       sku: p.sku,
//       barcode: p.barcode,
//       name: p.name,
//       description: p.description,
//       categoryId: p.categoryId,
//       categoryName: p.categoryName,
//       status: p.status as any,
//       costMethod: p.costMethod as any,
//       standardCost: p.standardCost,
//       salePrice: p.salePrice,
//       taxRate: p.taxRate,
//       reorderPoint: p.reorderPoint,
//       unitOfMeasure: p.unitOfMeasure as any,
//       createdAt: p.createdAt,
//       updatedAt: p.updatedAt,
//     }));
//   },

//   /**
//    * Obtiene un producto específico del cache
//    * @param id ID del producto
//    * @returns Producto o null si no existe
//    */
//   async getProduct(id: string): Promise<Product | null> {
//     const db = await getDB();
//     const product = await db.get('products', id);
//     if (!product) return null;
//     return {
//       id: product.id,
//       sku: product.sku,
//       barcode: product.barcode,
//       name: product.name,
//       description: product.description,
//       categoryId: product.categoryId,
//       categoryName: product.categoryName,
//       status: product.status as any,
//       costMethod: product.costMethod as any,
//       standardCost: product.standardCost,
//       salePrice: product.salePrice,
//       taxRate: product.taxRate,
//       reorderPoint: product.reorderPoint,
//       unitOfMeasure: product.unitOfMeasure as any,
//       createdAt: product.createdAt,
//       updatedAt: product.updatedAt,
//     };
//   },

//   /**
//    * Limpia todo el cache de productos
//    */
//   async clearProducts(): Promise<void> {
//     const db = await getDB();
//     await db.clear('products');
//   },

//   /**
//    * Obtiene la cantidad de productos en cache
//    */
//   async getProductsCount(): Promise<number> {
//     const db = await getDB();
//     return db.count('products');
//   },
// };

// Export dummy para no romper imports
export const productCache = {
  async saveProducts(): Promise<void> { /* No-op: cache offline no implementado */ },
  async getAllProducts(): Promise<never[]> { return []; },
  async getProduct(): Promise<null> { return null; },
  async clearProducts(): Promise<void> { /* No-op */ },
  async getProductsCount(): Promise<number> { return 0; },
};