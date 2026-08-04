export interface Prestamo {
  id?: string
  importeAprobado: number
  importeAprobadoEfectivo: number
  importeUtilizadoEfectivo: number
  importeAprobadoSuministros: number
  importeUtilizadoSuministros: number
  importeAprobadoSeguro: number
  importeUtilizadoSeguro: number
  numeroContrato: string
  cuenta: string
  observaciones: string
  toneladasMolibles: number
}

export interface PrestamoRequest {
  importeAprobado: number
  importeAprobadoEfectivo: number
  importeUtilizadoEfectivo: number
  importeAprobadoSuministros: number
  importeUtilizadoSuministros: number
  importeAprobadoSeguro: number
  importeUtilizadoSeguro: number
  numeroContrato: string
  cuenta: string
  observaciones: string
  toneladasMolibles: number
}
