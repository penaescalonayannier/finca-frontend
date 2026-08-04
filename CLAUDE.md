# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Preferencias del Usuario

- **No hacer preguntas**: Ejecutar las tareas directamente sin pedir confirmacion. Tomar decisiones autonomamente basandose en el contexto y las mejores practicas.
- **Actuar proactivamente**: Si algo no esta claro, usar el criterio profesional para resolver y continuar.

## Comandos de Desarrollo

```bash
npm install          # Instalar dependencias
npm run serve        # Servidor de desarrollo con hot-reload
npm run build        # Build de produccion
npm run lint         # Linting y correccion automatica
```

## Arquitectura

Proyecto Vue 3 con TypeScript y Composition API (`<script setup lang="ts">`).

### Stack Tecnologico
- **Vue 3** con Composition API
- **TypeScript** para tipado estatico
- **Axios** para peticiones HTTP
- **Vue CLI** como build tool

### Backend Proxy

El frontend se comunica con un backend en `http://localhost:9908`. El proxy esta configurado en `vue.config.js`:
- Todas las peticiones a `/api/*` se redirigen al backend
- API base para estados de cuenta: `/api/estado-cuenta`

### Estructura de Tipos

`src/types/EstadoCuenta.ts` define las interfaces principales:
- `EstadoCuenta` - Entidad principal
- `SearchFilter` - Filtros de busqueda
- `SearchRequest` - Request de busqueda paginada
- `PagedResponse<T>` - Respuesta paginada generica

### Estructura de Servicios

`src/services/EstadoCuentaService.ts` centraliza las llamadas HTTP:
- CRUD de estados de cuenta
- Busqueda con paginacion y filtros
- Upload de archivos XML (`Content-Type: application/xml`)

### Componentes Principales

- `EstadoCuentaList.vue` - Lista y busqueda de estados de cuenta
- `CrearEstadoCuenta.vue` - Formulario de creacion
- `EditarEstadoCuenta.vue` - Formulario de edicion
- `UploadXmlView.vue` - Carga de archivos XML

### Formato de Busqueda (API)

```typescript
{
  filter: SearchFilter[],  // Array de filtros
  query: string,           // Texto de busqueda
  pageSize: number,        // Tamano de pagina
  page: number,            // Numero de pagina
  sortBy: string,          // Campo de ordenamiento
  sortType: 'ASC' | 'DESC' // Direccion
}
```
