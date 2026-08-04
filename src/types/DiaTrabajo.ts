// src/types/DiaTrabajo.ts

export interface TrabajadorDia {
  id?: string
  diaTrabajoId?: string
  trabajadorId: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  horas: string
  norma: string
}

export interface DiaTrabajo {
  id?: string
  fecha: string // Formato: YYYY-MM-DD
  reporteId?: string
  trabajadores: TrabajadorDia[]
}

export interface DiaTrabajoRequest {
  fecha: string
}

export interface DiaTrabajoResponse {
  id: string
  fecha: string
  reporteId: string
  trabajadores: TrabajadorDiaResponse[]
}

export interface TrabajadorDiaResponse {
  id: string
  diaTrabajoId: string
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  horas: string
  norma: string
}

export interface DiaTrabajoListResponse {
  items: DiaTrabajoResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface TrabajadorDiaListResponse {
  items: TrabajadorDiaResponse[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}