// src/types/MovimientoStock.ts

export type TipoMovimientoStock =
  | 'ENTRADA_PRODUCCION'
  | 'ENTRADA_FACTURA'
  | 'ENTRADA_CONDUCE'
  | 'ENTRADA_AJUSTE'
  | 'SALIDA_VENTA'
  | 'SALIDA_AUTOCONSUMO'
  | 'SALIDA_COMEDOR'
  | 'SALIDA_AJUSTE'
  | 'TRANSFERENCIA_ENTRADA'
  | 'TRANSFERENCIA_SALIDA'
  | 'DEVOLUCION'
  | 'AJUSTE_MANUAL'
  | 'STOCK_INICIAL'
  | 'AJUSTE_EDICION'
  | 'REVERSION_PRODUCCION'
  | 'REVERSION_SALIDA'

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
  ENTRADA_FACTURA: 'Entrada por Factura',
  ENTRADA_CONDUCE: 'Entrada por Conduce',
  ENTRADA_AJUSTE: 'Ajuste de Entrada',
  SALIDA_VENTA: 'Venta',
  SALIDA_AUTOCONSUMO: 'Autoconsumo (Trabajadores)',
  SALIDA_COMEDOR: 'Comedor',
  SALIDA_AJUSTE: 'Ajuste de Salida',
  TRANSFERENCIA_ENTRADA: 'Transferencia (Entrada)',
  TRANSFERENCIA_SALIDA: 'Transferencia (Salida)',
  DEVOLUCION: 'Devolución',
  AJUSTE_MANUAL: 'Ajuste Manual',
  STOCK_INICIAL: 'Stock Inicial',
  AJUSTE_EDICION: 'Ajuste por Edición',
  REVERSION_PRODUCCION: 'Reversión de Producción',
  REVERSION_SALIDA: 'Reversión de Salida'
}

export const TIPO_MOVIMIENTO_COLORS: Record<TipoMovimientoStock, string> = {
  ENTRADA_PRODUCCION: 'success',
  ENTRADA_FACTURA: 'success',
  ENTRADA_CONDUCE: 'success',
  ENTRADA_AJUSTE: 'info',
  SALIDA_VENTA: 'danger',
  SALIDA_AUTOCONSUMO: 'warning',
  SALIDA_COMEDOR: 'orange',
  SALIDA_AJUSTE: 'info',
  TRANSFERENCIA_ENTRADA: 'primary',
  TRANSFERENCIA_SALIDA: 'primary',
  DEVOLUCION: 'warning',
  AJUSTE_MANUAL: 'info',
  STOCK_INICIAL: 'primary',
  AJUSTE_EDICION: 'secondary',
  REVERSION_PRODUCCION: 'secondary',
  REVERSION_SALIDA: 'secondary'
}
