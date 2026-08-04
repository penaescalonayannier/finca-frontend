export interface EvaluacionTrabajador {
  trabajadorId: string
  trabajadorNombre: string
  evaluacion: 'superior' | 'acuado' | 'deficiente' | ''
  firma?: string
  comentarios?: string
  calificacion?: number
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
}

export interface CreateEvaluacionRequest {
  grupoId: string
  fecha: string
  mes: string
  trabajadores: EvaluacionTrabajador[]
  firmaJefe?: string
}

export interface CreateBatchEvaluacionItem {
  trabajadorId: string
  calificacion: number
  comentarios: string
}

export interface CreateBatchEvaluacionRequest {
  mes: string
  year: number
  grupoId: string
  jefeId: string
  evaluaciones: CreateBatchEvaluacionItem[]
}
