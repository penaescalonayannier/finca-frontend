export interface Campos {
  id?: string
  bloque: string
  campo: string
  area: number
  variedad: string
  cepa: string
  poblacion: number
  destino: string
  rendimiento: number
}

export interface CamposRequest {
  bloque: string
  campo: string
  area: number
  variedad: string
  cepa: string
  poblacion: number
  destino: string
  rendimiento: number
}
