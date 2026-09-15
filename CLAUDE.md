# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción

Frontend Vue 3 + TypeScript para Sistema Finca — sistema de gestión agrícola.

## Comandos

```bash
npm run serve      # Servidor dev con hot-reload (puerto 8080)
npm run build      # Build de producción
npm run lint       # Lint y corrección automática
npm run type-check # Solo verificación TypeScript
```

## Arquitectura

Vue 3 Composition API con `<script setup lang="ts">`.

### Estructura del Proyecto

```
src/
├── views/              # Componentes de página
├── components/         # Componentes UI reutilizables
├── services/           # Clientes HTTP (uno por entidad)
├── types/              # Interfaces TypeScript
└── router/             # Configuración Vue Router
```

### Patrón de Servicios

Cada entidad tiene un servicio dedicado en `src/services/`:
- `FincaService.ts` — fincas
- `TrabajadorService.ts` — trabajadores
- `ProductoService.ts` — productos
- `FincaProductoService.ts` — inventarios por finca
- `SalidaService.ts` — distribuciones
- `DeudaTrabajadorService.ts` — deudas de trabajadores
- `AuthService.ts` — login/logout

### Comunicación con API

Proxy al backend configurado en `vue.config.js`:
- Todas las peticiones `/api/*` se redirigen a `http://localhost:9908`

### Contrato de Búsqueda

Todas las operaciones de búsqueda usan la misma estructura:

```typescript
{
  filter: [{ property: string, operator: string, value: string }],
  query: string,
  pageSize: number,
  page: number,
  sortBy: string,
  sortType: 'ASC' | 'DESC'
}
```

### Vistas Principales

- `LoginView.vue` — autenticación
- `HomeView.vue` — dashboard principal
- `GerencialDashboard.vue` — vista gerencial
- `ReportesView.vue` — generación de reportes
- `ListarEvaluacionesView.vue` — listado de evaluaciones

### Generación de PDF

Usa `jspdf` + `jspdf-autotable` + `html2canvas` para generación de PDF del lado del cliente.
