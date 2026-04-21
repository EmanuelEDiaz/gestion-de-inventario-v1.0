'use client';

/**
 * useCacheProgress - PERSISTENCIA NO IMPLEMENTADA
 * ==========================================
 * 
 * Hook para mostrar barra de progreso de carga de datos offline.
 * NO está activo actualmente - no hay datos que cargar.
 * 
 * DOCUMENTACIÓN PARA IMPLEMENTACIÓN FUTURA:
 * 
 * - Mostrar progreso de carga desde IndexedDB al inicio de la app
 * - 30% peso para app shell (siempre cargado)
 * - 70% peso para datos (repartido entre entidades)
 * - polling cada 3 segundos hasta completar
 * 
 * ==========================================
 * CÓDIGO COMENTADO - NO USAR HASTA IMPLEMENTACIÓN
 */

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { isPersistenceReady, getDB } from '@/infrastructure/storage/db';

// export interface CacheModule {
//   name: string;
//   store: 'products' | 'syncMeta';
//   loaded: boolean;
//   count: number;
// }

// const MODULE_DEFS: { name: string; store: 'products' | 'syncMeta' }[] = [
//   { name: 'Productos', store: 'products' },
// ];

// const CHECK_INTERVAL = 3_000;
// const MAX_CHECKS = 200;

// export function useCacheProgress() {
//   const [modules, setModules] = useState<CacheModule[]>(
//     MODULE_DEFS.map((m) => ({ ...m, loaded: false, count: 0 })),
//   );
//   const [overallPercent, setOverallPercent] = useState(0);
//   const [isComplete, setIsComplete] = useState(false);
//   const checksRef = useRef(0);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const checkStores = useCallback(async () => {
//     if (!isPersistenceReady()) return;

//     checksRef.current++;
//     if (checksRef.current > MAX_CHECKS) {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//       return;
//     }

//     try {
//       const db = await getDB();
//       const updated: CacheModule[] = [];

//       for (const mod of MODULE_DEFS) {
//         const count = await db.count(mod.store);
//         updated.push({ ...mod, loaded: true, count });
//       }

//       setModules(updated);

//       const APP_SHELL_WEIGHT = 30;
//       const DATA_WEIGHT = 70;
//       const loadedCount = updated.filter((m) => m.loaded).length;
//       const dataPercent = MODULE_DEFS.length > 0
//         ? (loadedCount / MODULE_DEFS.length) * DATA_WEIGHT
//         : DATA_WEIGHT;
//       const total = Math.round(APP_SHELL_WEIGHT + dataPercent);

//       setOverallPercent(total);
//       setIsComplete(total >= 100);

//       if (total >= 100 && intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     } catch {
//       // DB not ready yet
//     }
//   }, []);

//   useEffect(() => {
//     checksRef.current = 0;
//     checkStores();
//     intervalRef.current = setInterval(checkStores, CHECK_INTERVAL);

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [checkStores]);

//   return { modules, overallPercent, isComplete };
// }

// Export dummy - siempre indica 100% cuando no hay persistencia
import { useState, useEffect, useRef } from 'react';

export interface CacheModule {
  name: string;
  store: string;
  loaded: boolean;
  count: number;
}

export function useCacheProgress() {
  const [modules] = useState<CacheModule[]>([
    { name: 'Productos', store: 'products', loaded: false, count: 0 },
  ]);
  const [overallPercent, setOverallPercent] = useState(0);
  const [isComplete, setIsComplete] = useState(true); // Fake: siempre completo si no hay IndexedDB
  
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    
    // Simular carga rápida si no hay persistencia
    setOverallPercent(100);
    setIsComplete(true);
  }, []);
  
  return { modules, overallPercent, isComplete };
}