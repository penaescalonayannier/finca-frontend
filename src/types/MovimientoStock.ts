// src/types/MovimientoStock.ts

export type TipoMovimientoStock =
  | 'ENTRADA_PRODUCCION'
  | 'SALIDA_VENTA'
  | 'DEVOLUCION'
  | 'AJUSTE_MANUAL'
  | 'STOCK_INICIAL'
  | 'AJUSTE_EDICION'

export interface MovimientoStock {
  id: string
  fincaProductoId: string
  fincaId: string
  productoId: string
  tipo: TipoMovimientoStock
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  referenciaId?: string
  referenciaTabla?: string
  descripcion?: string
  fecha: string
  // Campos adicionales para mostrar
  fincaNombre?: string
  productoNombre?: string
}

export interface MovimientoStockResponse {
  items: MovimientoStock[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoStock, string> = {
  ENTRADA_PRODUCCION: 'Entrada de Producción',
  SALIDA_VENTA: 'Salida/Venta',
  DEVOLUCION: 'Devolución',
  AJUSTE_MANUAL: 'Ajuste Manual',
  STOCK_INICIAL: 'Stock Inicial',
  AJUSTE_EDICION: 'Ajuste por Edición'
}

export const TIPO_MOVIMIENTO_COLORS: Record<TipoMovimientoStock, string> = {
  ENTRADA_PRODUCCION: 'success',
  SALIDA_VENTA: 'danger',
  DEVOLUCION: 'warning',
  AJUSTE_MANUAL: 'info',
  STOCK_INICIAL: 'primary',
  AJUSTE_EDICION: 'secondary'
}
