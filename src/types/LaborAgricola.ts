export interface DotacionLaborAgricola {
  cargoId?: string
  cargoNombreSnapshot?: string
  hombresPorUnidad: number
  diasPlanificados: number
  horasPorDia: number
}

/** Plantilla técnica reutilizable; los salarios definitivos se congelan en el plan mensual. */
export interface LaborAgricola {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  codigoCentroCosto?: string
  centroCostoNombreSnapshot?: string
  tipoCultivoId?: string
  tipoCultivoNombreSnapshot?: string
  unidadMedida: string
  normaPorUnidad?: number
  indiceConsumo?: number
  nivelActividad?: string
  activo: boolean
  dotaciones: DotacionLaborAgricola[]
}

export type LaborAgricolaRequest = Omit<LaborAgricola, 'id' | 'tipoCultivoNombreSnapshot' | 'centroCostoNombreSnapshot'>
