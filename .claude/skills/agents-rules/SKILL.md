---
name: agents-rules
description: Reglas obligatorias del proyecto - AGENTS.md auto-loader
priority: CRITICAL
auto-load: true
---

# AGENTS.md - Reglas Obligatorias del Proyecto

> **CRITICAL:** Estas reglas se aplican a TODA tarea automáticamente.
> 
> **Skills cargados automáticamente al inicio**: `agents-rules`, `senior-frontend`, `react-best-practices`

---

## 0. Reglas Mandatory

| Regla | Descripción |
|-------|-------------|
| **Idioma** | Español en respuestas, nunca inglés salvo que el usuario lo pida |
| **Load skills** | Cargar skills relevantes antes de trabajar |
| **Mobile-first** | Toda UI debe funcionar en móvil |
| **Clean Architecture** | Capas: core → infrastructure → presentation |
| **SOLID principles** | SRP, OCP, LSP, ISP, DIP |
| **Repository pattern** | Interface + Implementation |
| **No deprecated APIs** | Usar versiones estables recientes |

---

## 0.1 Análisis Previo Obligatorio

- **Antes de actuar:** Revisar:
  - ¿Existe ya en backend? (Entity, Repository, Controller, DTOs)
  - ¿Existe en frontend? (hooks, componentes, vistas, entidades)
  - ¿Hay relaciones con otras entidades?
  - ¿Requiere cambios en DB?
  - ¿Necesita nuevos endpoints?
- **Presentar plan coherente:** Solo después del análisis completo
- **Pedir confirmación:** Nunca ejecutar sin confirmar

---

## 0.1 Reglas de Formularios y Validación

- **Validación en Frontend:** Regex para emails, números, campos requeridos
- **Tooltips obligatorios (OBLIGATORIO):** Todo campo, input, botón, label requiere `title` explicativo en español
- **Mensajes de error claros:** Cerca del campo problemático

---

## 0.3 Reutilización de Componentes

- Si se usa > 2 veces → componente global en `src/presentation/shared/components/ui/`
- **复用 antes de crear:** Verificar existente antes de crear nuevo

---

## 0.4 Límites de Tamaño (OBLIGATORIO)

- **Max 100 líneas por archivo de componente**
- **Un componente por archivo**
- **Hooks max 150 líneas**
- Exceder → dividir en sub-componentes

---

## 0.2 Reglas de Planificación

- **Revisar antes de actuar:** Nunca actuar sin revisar contexto
- **Plan detallado requerido:** Pasos específicos
- **Pedir confirmación:** No ejecutar sin OK del usuario

---

## Pre-Flight Checklist

Antes de escribir código:
1. ✅ Load relevant skills
2. ✅ Check domain entities
3. ✅ Check interfaces  
4. ✅ Component ≤ 100 lines?
5. ✅ TanStack Query para server data?

---

## Reglas de Código

| Categoría | Regla |
|-----------|-------|
| **Imports** | 1) External → 2) Core → 3) Interfaces → 4) Infrastructure → 5) Presentation |
| **Naming** | TS: kebab-case, TSX: PascalCase, Interfaces: PascalCase, Hooks: camelCase |
| **State** | Server: TanStack Query, Client: Zustand, No Redux |
| **CSS** | Tailwind CSS v4, usar `cn()` utility |
| **Prohibido** | `any` sin justificación, console.log en producción, >100 líneas por componente |

---

## Build / Lint / Test Commands

```bash
# Frontend (use pnpm in frontend/)
pnpm build
pnpm lint

# Backend (use maven in backend/inventory-app)
mvn compile
```