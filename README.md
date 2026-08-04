# Sistema Finca - Frontend

Frontend Vue 3 + TypeScript para el Sistema de Gestión de Finca.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 14+ (recomendado 16+)
- npm 6+ o yarn 1.22+

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo con hot-reload
npm run serve

# Hacer build para producción
npm run build

# Linting y corrección automática
npm run lint
```

El servidor de desarrollo estará disponible en `http://localhost:8080`

## 📁 Estructura del Proyecto

```
src/
├── assets/              # Recursos estáticos (imágenes, estilos)
├── components/          # Componentes reutilizables
├── router/             # Configuración de rutas (Vue Router)
├── services/           # Servicios HTTP (Axios)
├── types/              # Interfaces y tipos TypeScript
├── utils/              # Funciones utilitarias
├── views/              # Componentes de página (nivel de ruta)
├── App.vue             # Componente raíz
└── main.ts             # Punto de entrada
```

## 🔧 Configuración

### Variables de Entorno

Copia `.env.example` a `.env.local` para configuración local:

```bash
cp .env.example .env.local
```

Variables disponibles:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VUE_APP_API_BASE_URL` | URL base del API | `http://localhost:9908/api` |
| `VUE_APP_KEYCLOAK_URL` | URL del servidor Keycloak | `https://auth.chevere.ddns.net` |
| `VUE_APP_KEYCLOAK_REALM` | Realm de Keycloak | `kynsoft` |
| `VUE_APP_KEYCLOAK_CLIENT_ID` | Client ID en Keycloak | `medinec` |
| `VUE_APP_ENV` | Ambiente | `development` |
| `VUE_APP_DEBUG` | Modo debug | `true` |

### Configuración de Proxy

El proxy del API está configurado en `vue.config.js`:

- Todas las peticiones a `/api/*` se redirigen a `http://localhost:9908/api`
- Solo funciona en modo desarrollo
- En producción, actualizar `VUE_APP_API_BASE_URL`

## 📦 Stack Tecnológico

### Dependencias Principales
- **Vue 3** - Framework progresivo
- **Vue Router** - Enrutamiento SPA
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **jsPDF** - Generación de PDFs
- **html2canvas** - Captura de HTML a imagen

### Herramientas de Desarrollo
- **Vue CLI** - Build tool
- **ESLint** - Linting
- **TypeScript** - Verificación de tipos
- **Babel** - Transpilación de ES6+

## 🛣️ Rutas Principales

El router está configurado en `src/router/index.ts`:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | EstadoCuentaList | Lista de estados de cuenta |
| `/crear` | CrearEstadoCuenta | Crear nuevo estado de cuenta |
| `/editar/:id` | EditarEstadoCuenta | Editar estado de cuenta |
| `/upload` | UploadXmlView | Subir archivo XML |

## 🔌 Servicios API

### EstadoCuentaService

Servicio central para operaciones con estados de cuenta:

```typescript
// CRUD básico
getById(id: string)
create(data: CreateEstadoCuentaRequest)
update(id: string, data: UpdateEstadoCuentaRequest)
delete(id: string)

// Búsqueda y filtrado
search(filters: SearchFilter[], query?: string, page?: number, pageSize?: number)
searchByDateRange(startDate: LocalDate, endDate: LocalDate)

// Exportación e importación
export(filters?: SearchFilter[])
uploadXml(file: File)
```

### Estructura de Tipos

```typescript
// Entidad principal
interface EstadoCuenta {
  id: string
  fecha: LocalDate
  refOrigen: string
  refCorriente: string
  observaciones: string
  tipo: string
  importe: number
  clienteId: string
}

// Filtros de búsqueda
interface SearchFilter {
  field: string
  operator: string
  value: any
}

// Respuesta paginada
interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}
```

## 🎨 Componentes Principales

### EstadoCuentaList
- Lista paginada de estados de cuenta
- Búsqueda por texto
- Filtrado avanzado
- Acciones (editar, eliminar)

### CrearEstadoCuenta
- Formulario de creación
- Validación de campos
- Guardado con feedback

### EditarEstadoCuenta
- Formulario de edición
- Precarga de datos
- Actualización con validación

### UploadXmlView
- Carga de archivos XML
- Validación de formato
- Feedback de progreso

## 🔐 Autenticación

El sistema usa Keycloak para autenticación OAuth2/JWT.

**Configuración actual:**
- Realm: `kynsoft`
- Client ID: `medinec`
- URL: `https://auth.chevere.ddns.net`

Para configurar Keycloak:
1. Instalar e integrar `@keycloak/keycloak-js`
2. Crear interceptor en Axios para inyectar token JWT
3. Manejar redirección a login cuando token expire

## 📊 Exportación de Datos

El frontend soporta exportación a múltiples formatos:

### PDF (jsPDF + html2canvas)
```typescript
exportToPdf(data: EstadoCuenta[])
```

### Excel (Backend)
```typescript
// El backend proporciona endpoint /api/estado-cuenta/export
```

### XML (Upload)
```typescript
// Para importar estados de cuenta desde XML
uploadXml(file: File)
```

## 🧪 Desarrollo

### Hot Module Replacement (HMR)
El servidor de desarrollo soporta HMR automático. Los cambios en componentes se reflejan instantáneamente.

### Debugging
- Vue DevTools: [Extensión navegador](https://devtools.vuejs.org/)
- Browser DevTools: F12
- Logs: `console.log()` en componentes

### ESLint
```bash
# Verificar sintaxis
npm run lint

# Corregir automáticamente
npm run lint -- --fix
```

## 🚀 Deployment

### Producción (Build estático)
```bash
npm run build
```

Genera carpeta `dist/` con:
- `index.html` - Archivo de entrada
- `js/` - Bundles JavaScript (versionados)
- `css/` - Estilos compilados

### Hosting
Puede deployarse en:
- **Netlify** - Conexión directa a Git
- **Vercel** - Optimizado para Vue
- **AWS S3 + CloudFront** - Escalable
- **Cualquier servidor HTTP** - Servidor web tradicional

### Configuración de Producción
Actualizar variables de entorno:

```bash
# .env.production
VUE_APP_API_BASE_URL=https://api.tudominio.com/api
VUE_APP_DEBUG=false
```

## 📝 Commitizen

Para mantener commits consistentes:

```bash
npm run commit
```

O editar manualmente siguiendo formato:
```
<tipo>: <descripción corta>

<descripción detallada>
```

Tipos: feat, fix, docs, style, refactor, perf, test, chore

## 🤝 Contribuciones

1. Crear rama: `git checkout -b feature/mi-feature`
2. Commit: `git commit -m "feat: descripción"`
3. Push: `git push origin feature/mi-feature`
4. Pull Request en GitHub

## 📚 Recursos

- [Documentación Vue 3](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://axios-http.com/)
- [Vue DevTools](https://devtools.vuejs.org/)

## 📄 Licencia

Privado - Sistema Finca 2026
