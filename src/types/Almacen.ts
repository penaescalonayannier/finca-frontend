// src/types/Almacen.ts

import type { DestinoSalida, ItemSalida } from './Salida'

export interface Almacen {
  id?: string
  nombre: string
  inventario: string
  fincaId?: string
  fincaCode?: string
  fincaName?: string
  productos?: AlmacenFincaProducto[]
  productosCount?: number
}

export interface AlmacenRequest {
  nombre: string
  inventario: string
  fincaId?: string
}

export interface AlmacenResponse {
  id: string
  nombre: string
  inventario: string
  productos: AlmacenFincaProducto[]
}

export interface AlmacenProductoRequest {
  almacenId: string
  fincaProductoId: string
}

// Stock por almacén
export interface AlmacenFincaProducto {
  id: string
  almacenId: string
  almacenNombre: string
  almacenInventario: string
  fincaProductoId: string
  productoId: string
  productoCode: string
  productoName: string
  productoPrice: number
  unidadMedida?: string
  stock: number
  stockMinimo: number
  stockMaximo?: number
  estadoStock: 'NORMAL' | 'BAJO' | 'CRITICO' | 'EXCESO'
  activo: boolean
  alertaStockBajo?: boolean
  deficit?: number
  createdAt?: string
  updatedAt?: string
}

export type TipoMovimientoStock =
  | 'ENTRADA_PRODUCCION'
  | 'ENTRADA_FACTURA'
  | 'ENTRADA_CONDUCE'
  | 'ENTRADA_AJUSTE'
  | 'SALIDA'
  | 'SALIDA_AJUSTE'
  | 'TRANSFERENCIA_ENTRADA'
  | 'TRANSFERENCIA_SALIDA'

export interface EntradaAlmacenRequest {
  almacenFincaProductoId: string
  cantidad: number
  tipo: TipoMovimientoStock
  descripcion?: string
  numeroFactura?: string
  /** Número del conduce de recepción cuando el tipo es ENTRADA_CONDUCE. */
  numeroConduce?: string
  /** Datos obligatorios del expediente SC-2-04 para factura o conduce. */
  proveedor?: string
  responsableEntrega?: string
  responsableRecibe?: string
  costoUnitario?: number
  fechaDocumento?: string
}

/**
 * Datos de una entrada originada por producción terminada. El backend crea
 * tanto el documento de producción como el movimiento de entrada en una sola
 * operación para que no puedan quedar registros desincronizados.
 */
export interface EntradaProduccionAlmacenRequest {
  almacenFincaProductoId: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorRecibeId: string
  observaciones?: string
  lote?: string
  centroCosto?: string
  costoUnitario?: number
}

export interface EntradaProduccionAlmacenResponse {
  produccionTerminadaId: string
  almacenFincaProductoId: string
  stockNuevo: number
}

export interface LineaSalidaMultipleAlmacenRequest {
  almacenFincaProductoId: string
  cantidad: number
  items?: ItemSalida[]
}

export interface SalidaMultipleAlmacenRequest {
  destino: DestinoSalida
  observaciones?: string
  lineas: LineaSalidaMultipleAlmacenRequest[]
}

export interface SalidaMultipleAlmacenResponse {
  salidaIds: string[]
  cantidadLineas: number
  command: string
}

export interface TransferenciaAlmacenRequest {
  almacenFincaProductoId: string
  destinoAlmacenId: string
  cantidad: number
  observaciones?: string
}

export interface TransferenciaAlmacenLineaDetalle {
  id: string
  fincaProductoId: string
  productoNombre: string
  unidadMedida?: string
  cantidadDespachada: number
  cantidadRecibida?: number
  cantidadRechazada?: number
  observaciones?: string
}

export interface TransferenciaAlmacenDetalle {
  id: string
  fincaId: string
  numeroDocumento: string
  origenAlmacenId: string
  origenAlmacenNombre?: string
  destinoAlmacenId: string
  destinoAlmacenNombre?: string
  estado: 'EN_TRANSITO' | 'RECIBIDA' | 'RECHAZADA' | 'REVERSADA'
  fechaDespacho: string
  fechaRecepcion?: string
  observaciones?: string
  motivoCierre?: string
  lineas: TransferenciaAlmacenLineaDetalle[]
}

export interface RecepcionTransferenciaAlmacenRequest {
  observaciones?: string
  lineas: Array<{ lineaId: string; cantidadRecibida: number; observaciones?: string }>
}

export interface AsignarProductoStockRequest {
  fincaProductoId: string
  stockInicial?: number
  stockMinimo?: number
  stockMaximo?: number
}

export interface StockOperationResponse {
  almacenFincaProductoId?: string
  cantidad?: number
  stockNuevo?: number
  stockOrigenNuevo?: number
  stockDestinoNuevo?: number
  message?: string
  informeRecepcionId?: string
  movimientoStockId?: string
}
