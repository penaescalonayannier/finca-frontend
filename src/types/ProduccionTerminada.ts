// src/types/ProduccionTerminada.ts

export interface ProduccionTerminada {
  id: string
  fincaId: string
  fincaCode: string
  fincaName: string
  productoId: string
  productoCode: string
  productoName: string
  fecha: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorEntregaNombre: string
  trabajadorRecibeId: string
  trabajadorRecibeNombre: string
  observaciones: string
}

export interface CreateProduccionTerminadaRequest {
  fincaId: string
  productoId: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorRecibeId: string
  observaciones?: string
}

export interface UpdateProduccionTerminadaRequest {
  id: string
  fincaId: string
  productoId: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorRecibeId: string
  observaciones?: string
}

export interface ProduccionTerminadaResponse {
  data: ProduccionTerminada[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}
