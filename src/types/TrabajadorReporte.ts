// src/types/TrabajadorReporte.ts

export interface TrabajadorReporte {
  id: string
  trabajador: string
  trabajadorId?: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  reporte: string
  reporteId?: string
  reporteCodigo?: string
  reporteBloque?: string
  reporteCampo?: string
  norma: string
  horas: string
}

export interface TrabajadorReporteRequest {
  trabajador: string
  reporte: string
  norma: string
  horas: string
}

export interface TrabajadorReporteResponse {
  id: string
  trabajador: string
  reporte: string
  norma: string
  horas: string
}

export interface AsignarTrabajadorRequest {
  trabajadorId: string
  reporteId: string
  norma: string
  horas: string
}

export interface ActualizarAsignacionRequest {
  trabajadorId: string
  reporteId: string
  norma: string
  horas: string
}

export interface TrabajadorReporteListResponse {
  items: TrabajadorReporte[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}