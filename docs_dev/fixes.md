# Fixes — Fase R (SW Caching)

## FIX-001: Ruta duplicada /~offline en fase R.4

**Fase**: R.4 — Offline fallback page

**Síntoma**: Next.js 500 error en tiempo de ejecución:
```
You cannot have two parallel pages that resolve to the same path.
Please check /(offline)/~offline and /~offline.
```

**Causa raíz**: El plan `refactor.md` asumió que `app/~offline/page.tsx` no existía y creó `app/(offline)/~offline/page.tsx`. En realidad, ya existía una página offline en `app/~offline/page.tsx` con funcionalidad superior (iconos lucide de `icon-mapping`, detector online/offline con event listeners, mensaje de reconexión).

**Solución**: Eliminar el grupo `(offline)` completo (layout + page). La página existente en `app/~offline/page.tsx` ya es la correcta.

**Archivos eliminados**:
- `frontend/src/app/(offline)/layout.tsx`
- `frontend/src/app/(offline)/~offline/page.tsx`

**Estado**: ✅ Resuelto

**Lección**: El audit del plan debe verificar que no existan ya archivos que resuelvan la misma ruta antes de crear una ruta nueva. Usar `find src/app -name "*offline*"` en auditorías futuras.
