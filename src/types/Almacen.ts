// src/types/Almacen.ts

import type { DestinoSalida } from './Salida'

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
}

export interface SalidaAlmacenRequest {
  almacenFincaProductoId: string
  cantidad: number
  descripcion?: string
  trabajadorId?: string
  destino?: 'TRABAJADOR' | 'COMEDOR' | 'VENTA' | 'OTRO'
}

export interface LineaSalidaMultipleAlmacenRequest {
  almacenFincaProductoId: string
  cantidad: number
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
}
