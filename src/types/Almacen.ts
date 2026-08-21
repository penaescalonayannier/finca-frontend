// src/types/Almacen.ts

import type { FincaProducto } from './FincaProducto'

export interface Almacen {
  id?: string
  nombre: string
  inventario: string
  fincaId?: string
  fincaCode?: string
  fincaName?: string
  productos?: FincaProducto[]
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
  productos: FincaProducto[]
}

export interface AlmacenProductoRequest {
  almacenId: string
  fincaProductoId: string
}
