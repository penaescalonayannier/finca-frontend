export interface HistorialSalario {
  id?: string
  trabajadorId: string
  fincaId?: string
  cargoId?: string
  fechaVigencia: string
  salarioEscala: number
  anticipoDiario?: number
  tasa?: number
  motivo: string
  estado?: 'ACTIVO' | 'ANULADO'
  autorizadoPorId?: string
}
