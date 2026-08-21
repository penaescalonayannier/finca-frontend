// src/types/Producto.ts

export type TipoProducto = 'INSUMO' | 'VENTA' | 'OTROS'

// Unidades de medida según la especificación
export type UnidadMedida =
  | 'KG'    // Kilogramo - Peso
  | 'G'     // Gramo - Peso
  | 'LB'    // Libra - Peso
  | 'QQ'    // Quintal - Peso
  | 'L'     // Litro - Volumen
  | 'ML'    // Mililitro - Volumen
  | 'GAL'   // Galón - Volumen
  | 'UND'   // Unidad - Cantidad
  | 'DOC'   // Docena - Cantidad
  | 'SACO'  // Saco - Cantidad
  | 'CAJA'  // Caja - Cantidad
  | 'M'     // Metro - Longitud
  | 'CM'    // Centímetro - Longitud

// Lista de unidades para usar en selects
export const UNIDADES_MEDIDA: { value: UnidadMedida; label: string; categoria: string }[] = [
  { value: 'KG', label: 'Kilogramo', categoria: 'Peso' },
  { value: 'G', label: 'Gramo', categoria: 'Peso' },
  { value: 'LB', label: 'Libra', categoria: 'Peso' },
  { value: 'QQ', label: 'Quintal', categoria: 'Peso' },
  { value: 'L', label: 'Litro', categoria: 'Volumen' },
  { value: 'ML', label: 'Mililitro', categoria: 'Volumen' },
  { value: 'GAL', label: 'Galón', categoria: 'Volumen' },
  { value: 'UND', label: 'Unidad', categoria: 'Cantidad' },
  { value: 'DOC', label: 'Docena', categoria: 'Cantidad' },
  { value: 'SACO', label: 'Saco', categoria: 'Cantidad' },
  { value: 'CAJA', label: 'Caja', categoria: 'Cantidad' },
  { value: 'M', label: 'Metro', categoria: 'Longitud' },
  { value: 'CM', label: 'Centímetro', categoria: 'Longitud' },
]

export interface Producto {
  id?: string
  code: string
  name: string
  description?: string
  price: number
  priceTrabajador: number
  priceComedor: number
  unidadMedida: UnidadMedida
  stock: number
  active: boolean
  tipoProducto: TipoProducto
}

export interface ProductoRequest {
  code: string
  name: string
  description?: string
  price: number
  priceTrabajador: number
  priceComedor: number
  unidadMedida: UnidadMedida
  stock: number
  active?: boolean
  tipoProducto: TipoProducto
}

export interface ProductoResponse {
  id: string
  code: string
  name: string
  description: string
  price: number
  priceTrabajador: number
  priceComedor: number
  unidadMedida: UnidadMedida
  stock: number
  active: boolean
  tipoProducto: TipoProducto
}
