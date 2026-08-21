// src/types/Salida.ts

export type TipoSalida = 'VALE' | 'FACTURA'

export type DestinoSalida = 'TRABAJADORES' | 'COMEDOR' | 'VENTA_ESTADO' | 'POBLACION' | 'INSUMO' | 'OTROS'

export interface Salida {
  id: string
  tipo: TipoSalida
  destino: DestinoSalida
  numero: string
  fincaProductoId: string
  fincaCode: string
  fincaName: string
  productoCode: string
  productoName: string
  stockActual: number
  fecha: string
  observaciones: string
  cantidadTotal: number
  items?: ItemSalida[]
}

export interface ItemSalida {
  id?: string
  salidaId?: string
  trabajadorId: string
  trabajadorNombre?: string
  cantidad: number
  precio?: number
  pagado?: boolean
}

export interface CreateSalidaRequest {
  destino: DestinoSalida
  fincaProductoId: string
  observaciones?: string
  items: ItemSalida[]
}

// Mapeo de destino a tipo (RN-09)
export const DESTINO_TIPO_MAP: Record<DestinoSalida, TipoSalida> = {
  TRABAJADORES: 'VALE',
  COMEDOR: 'VALE',
  INSUMO: 'VALE',
  OTROS: 'VALE',
  VENTA_ESTADO: 'FACTURA',
  POBLACION: 'FACTURA'
}

// Mapeo de destino a precio usado
export const DESTINO_PRECIO_MAP: Record<DestinoSalida, string> = {
  TRABAJADORES: 'Precio Trabajador',
  COMEDOR: 'Precio Comedor',
  VENTA_ESTADO: 'Precio Venta',
  POBLACION: 'Precio Venta',
  INSUMO: 'Precio Venta',
  OTROS: 'Precio Venta'
}

export interface UpdateSalidaRequest {
  id: string
  tipo: TipoSalida
  fincaProductoId: string
  observaciones?: string
  items: ItemSalida[]
}

export interface SalidaResponse {
  data: Salida[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}
