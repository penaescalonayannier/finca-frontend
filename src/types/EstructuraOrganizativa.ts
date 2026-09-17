export type TipoAreaTrabajo = 'AREA' | 'DEPARTAMENTO' | 'BRIGADA'

export interface AreaTrabajo {
  id?: string
  fincaId: string
  areaPadreId?: string
  responsableId?: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo: TipoAreaTrabajo
  activo?: boolean
  fechaInicio?: string
  fechaFin?: string
}

export interface Plaza {
  id?: string
  fincaId: string
  areaId?: string
  grupoId?: string
  cargoId: string
  responsableId?: string
  codigo: string
  nombre?: string
  activo?: boolean
  fechaInicio?: string
  fechaFin?: string
  observaciones?: string
  trabajadorId?: string
  trabajadorNombre?: string
  estado?: 'VACANTE' | 'OCUPADA' | 'INACTIVA'
}
