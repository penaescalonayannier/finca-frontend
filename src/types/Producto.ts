// src/types/Producto.ts

export interface Producto {
  id?: string
  code: string
  name: string
  description?: string
  price: number
  stock: number
  active: boolean
}

export interface ProductoRequest {
  code: string
  name: string
  description?: string
  price: number
  stock: number
  active?: boolean
}

export interface ProductoResponse {
  id: string
  code: string
  name: string
  description: string
  price: number
  stock: number
  active: boolean
}