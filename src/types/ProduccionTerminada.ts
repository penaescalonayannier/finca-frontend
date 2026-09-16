// src/types/ProduccionTerminada.ts

export interface ProduccionTerminada {
  id: string
  fincaId: string
  fincaCode: string
  fincaName: string
  productoId: string
  productoCode: string
  productoName: string
  almacenFincaProductoId?: string
  almacenNombre?: string
  fecha: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorEntregaNombre: string
  trabajadorRecibeId: string
  trabajadorRecibeNombre: string
  observaciones: string
  lote?: string
  centroCosto?: string
  costoUnitario?: number
}

export interface CreateProduccionTerminadaRequest {
  fincaId: string
  productoId: string
  almacenFincaProductoId: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorRecibeId: string
  observaciones?: string
  lote?: string
  centroCosto?: string
  costoUnitario?: number
}

export interface UpdateProduccionTerminadaRequest {
  id: string
  fincaId: string
  productoId: string
  almacenFincaProductoId?: string
  cantidadTerminada: number
  trabajadorEntregaId: string
  trabajadorRecibeId: string
  observaciones?: string
  lote?: string
  centroCosto?: string
  costoUnitario?: number
}

export interface ProduccionTerminadaResponse {
  data: ProduccionTerminada[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}
