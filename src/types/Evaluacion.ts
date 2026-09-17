export interface EvaluacionTrabajador {
  trabajadorId: string
  trabajadorNombre: string
  evaluacion: 'superior' | 'acuado' | 'deficiente' | ''
  firma?: string
  comentarios?: string
  calificacion?: number
  constanciaTrabajador?: string
}

export type EstadoEvaluacion = 'BORRADOR' | 'ENVIADA' | 'CERRADA' | 'ANULADA'

export interface CriterioEvaluacion {
  id?: string
  nombre: string
  descripcion?: string
  activo?: boolean
  orden?: number
}

export interface Evaluacion {
  id: string
  grupoId: string
  grupoNombre: string
  fecha: string
  mes: string
  trabajadores: EvaluacionTrabajador[]
  firmaJefe?: string
  jefeNombre?: string
  createdAt?: string
  updatedAt?: string
  estado?: EstadoEvaluacion
  evidencia?: string
  criteriosAplicados?: string
  constanciaJefe?: string
  fechaEnvio?: string
  fechaCierre?: string
  observacionesCierre?: string
}

export interface CreateEvaluacionRequest {
  grupoId: string
  fecha: string
  mes: string
  trabajadores: EvaluacionTrabajador[]
  firmaJefe?: string
  evidencia?: string
  criteriosAplicados?: string
}

export interface CreateBatchEvaluacionItem {
  trabajadorId: string
  calificacion: number
  comentarios: string
  constanciaTrabajador?: string
}

export interface CreateBatchEvaluacionRequest {
  mes: string
  year: number
  grupoId: string
  jefeId: string
  evaluaciones: CreateBatchEvaluacionItem[]
  evidencia?: string
  criteriosAplicados?: string
  constanciaJefe?: string
}
