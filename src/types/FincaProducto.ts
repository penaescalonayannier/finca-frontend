// src/types/FincaProducto.ts

import type { TipoProducto } from './Producto'

export type EstadoStock = 'CRITICO' | 'BAJO' | 'NORMAL' | 'EXCESO'

export interface FincaProducto {
  id: string
  fincaId: string
  fincaCode: string
  fincaName: string
  productoId: string
  productoCode: string
  productoName: string
  productoPrice: number
  productoTipo: TipoProducto
  stock: number
  stockMinimo: number
  stockMaximo: number | null
  estadoStock: EstadoStock
  activo: boolean
}

export interface FincaProductoRequest {
  fincaId: string
  productoId: string
  stock: number
}

export interface AsignarProductoRequest {
  fincaId: string
  productoId: string
  stock: number
  stockMinimo?: number
}

export interface ActualizarStockRequest {
  fincaId: string
  productoId: string
  stock: number
}

export interface RemoverProductoRequest {
  fincaId: string
  productoId: string
}

export interface FincaProductoResponse {
  items: FincaProducto[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface EntradaProduccionRequest {
  fincaId: string
  productoId: string
  cantidad: number
  descripcion?: string
  centroCosto?: string  // Código del centro de costo para contabilidad (ej: 700.01.04)
}

export interface EntradaProduccionResponse {
  fincaId: string
  productoId: string
  cantidadAgregada: number
  nuevoStock: number
  mensaje: string
}