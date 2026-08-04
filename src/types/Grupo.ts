export interface TrabajadorGrupo {
  id: string
  nombre: string
  ruc: string
  cargoName?: string
}

export interface JefeGrupo {
  id: string
  nombre: string
  ruc: string
  cargoName?: string
}

export interface Grupo {
  id: string
  nombre: string
  descripcion?: string
  jefeId: string
  jefe?: JefeGrupo
  trabajadores?: TrabajadorGrupo[]
}

export interface GrupoResponse {
  id: string
  nombre: string
  descripcion?: string
  jefeId: string
  jefe?: JefeGrupo
  trabajadores?: TrabajadorGrupo[]
}

export interface CreateGrupoRequest {
  nombre: string
  descripcion?: string
  jefeId: string
}

export interface UpdateGrupoRequest {
  id: string
  nombre: string
  descripcion?: string
  jefeId: string
}

export interface GrupoListResponse {
  data: GrupoResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  totalElementsPage: number
}
