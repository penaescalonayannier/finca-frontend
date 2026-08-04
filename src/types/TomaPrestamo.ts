// Archivo: TomaPrestamo.ts

export type TipoTomaPrestamo = 'EFECTIVO' | 'SUMINISTROS' | 'SEGURO' // Corregido: 'SUMINISTRO' -> 'SUMINISTROS'

export interface TomaPrestamo {
  id?: string
  importe: number
  fecha: string
  cuentaDestino: string
  tipo: TipoTomaPrestamo
  observaciones: string
  creditoId: string // Añadido: Lo necesitamos para el modelo completo
}

export interface TomaPrestamoRequest {
  importe: number
  fecha: string
  cuentaDestino: string
  tipo: TipoTomaPrestamo
  observaciones: string
  creditoId: string // Añadido: Campo necesario para el POST
}