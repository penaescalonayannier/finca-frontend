export type CategoriaTipoCultivo = 'CANNA' | 'VIANDA' | 'OTRO'

export interface TipoCultivo {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria: CategoriaTipoCultivo
  requiereCampo: boolean
  activo: boolean
  orden?: number
}

export interface TipoCultivoRequest {
  codigo: string
  nombre: string
  descripcion?: string
  categoria: CategoriaTipoCultivo
  requiereCampo: boolean
  activo?: boolean
  orden?: number
}
