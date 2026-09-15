export type TipoSubclasificacion = 'CULTIVO' | 'ANIMAL' | 'NINGUNO'
export type CategoriaTipoCultivoFiltro = 'CANNA' | 'VIANDA' | 'OTRO' | null

export interface TipoReporte {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  codigoCentroCosto: string
  tipoSubclasificacion: TipoSubclasificacion
  tipoCultivoCategoriaFiltro?: CategoriaTipoCultivoFiltro
  tipoCultivoAutoId?: string
  requiereCampo: boolean
  activo: boolean
  orden?: number
}

export interface TipoReporteRequest {
  codigo: string
  nombre: string
  descripcion?: string
  codigoCentroCosto: string
  tipoSubclasificacion: TipoSubclasificacion
  tipoCultivoCategoriaFiltro?: CategoriaTipoCultivoFiltro
  tipoCultivoAutoId?: string
  requiereCampo: boolean
  activo?: boolean
  orden?: number
}
