// src/types/Reporte.ts

export interface Reporte {
  id?: string
  bloque: string
  campo: string
  area: string
  norma: string
  fecha: string
  codigo: string
  year: string
  mes: string
  trabajadorResponsableId?: string
  trabajadorResponsableNombre?: string
}

export interface ReporteRequest {
  bloque: string
  campo: string
  area: string
  norma: string
  fecha: string
  codigo: string
  year: string
  mes: string
  trabajadorResponsableId?: string
}

export interface ReporteResponse {
  id: string
  bloque: string
  campo: string
  area: string
  norma: string
  fecha: string
  codigo: string
  year: string
  mes: string
  trabajadorResponsableId?: string
  trabajadorResponsableNombre?: string
}