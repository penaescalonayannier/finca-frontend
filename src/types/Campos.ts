export interface BloqueInfo {
  id: string
  code: string
  name: string
  fincaId?: string
  fincaNombre?: string
}

export interface VariedadInfo {
  id: string
  code: string
  name: string
}

export interface CepaInfo {
  id: string
  code: string
  name: string
}

export interface Campos {
  id?: string
  bloque?: BloqueInfo
  campo: string
  area: number
  variedad?: VariedadInfo
  cepa?: CepaInfo
  poblacion: number
  destino: string
  rendimiento: number
  valorAdquisicion?: number
  depreciacionAcumulada?: number
  valorResidual?: number
  valorActual?: number
  anosCepa?: number
  tasaDepreciacionAnual?: number
  vidaUtilAnios?: number
  fechaUltimaDepreciacion?: string
  fechaInicioDepreciacion?: string
}

export interface CamposRequest {
  bloque: string
  campo: string
  area: number
  variedad: string
  cepa: string
  poblacion: number
  destino: string
  rendimiento: number
  valorAdquisicion?: number
  depreciacionAcumulada?: number
  valorResidual?: number
  anosCepa?: number
  tasaDepreciacionAnual?: number
  vidaUtilAnios?: number
  fechaInicioDepreciacion?: string
}

export interface CalcularDepreciacionRequest {
  campoIds: string[]
  meses: number
}

export interface CalcularDepreciacionResponse {
  camposActualizados: number
}
