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
