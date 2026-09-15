export interface TipoAnimal {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
  orden?: number
}

export interface TipoAnimalRequest {
  codigo: string
  nombre: string
  descripcion?: string
  activo?: boolean
  orden?: number
}
