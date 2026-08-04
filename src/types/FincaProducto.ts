// src/types/FincaProducto.ts

export interface FincaProducto {
  id: string
  fincaId: string
  fincaCode: string
  fincaName: string
  productoId: string
  productoCode: string
  productoName: string
  productoPrice: number
  stock: number
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