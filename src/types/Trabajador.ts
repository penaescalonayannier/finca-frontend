// src/types/Trabajador.ts

import type { Cargo } from './Cargo'

export interface Trabajador {
  id?: string
  ruc: string
  nombre: string
  cuenta: string
  cargoId?: string
  cargoName?: string
  activo?: boolean
}

export interface TrabajadorRequest {
  ruc: string
  nombre: string
  cuenta: string
  cargoId?: string
  activo?: boolean
}

export interface TrabajadorResponse {
  id: string
  ruc: string
  nombre: string
  cuenta: string
  cargoId?: string
  cargoName?: string
  activo: boolean
}