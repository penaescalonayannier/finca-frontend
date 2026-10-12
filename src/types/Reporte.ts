// src/types/Reporte.ts

export interface Reporte {
  id?: string
  tipoReporteId?: string
  tipoReporteNombre?: string
  tipoReporteCentroCosto?: string
  tipoCultivoId?: string
  tipoCultivoNombre?: string
  tipoCultivoRequiereCampo?: boolean
  tipoAnimalId?: string
  tipoAnimalNombre?: string
  productoId?: string
  cantidadCosechada?: number
  unidadMedidaSnapshot?: string
  precioUnitarioReferencia?: number
  tipoPrecioReferencia?: string
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
  tipoReporteId?: string
  tipoCultivoId?: string
  tipoAnimalId?: string
  productoId?: string
  cantidadCosechada?: number
  unidadMedidaSnapshot?: string
  precioUnitarioReferencia?: number
  tipoPrecioReferencia?: string
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
  tipoReporteId?: string
  tipoReporteNombre?: string
  tipoReporteCentroCosto?: string
  tipoCultivoId?: string
  tipoCultivoNombre?: string
  tipoCultivoRequiereCampo?: boolean
  tipoAnimalId?: string
  tipoAnimalNombre?: string
  productoId?: string
  cantidadCosechada?: number
  unidadMedidaSnapshot?: string
  precioUnitarioReferencia?: number
  tipoPrecioReferencia?: string
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
