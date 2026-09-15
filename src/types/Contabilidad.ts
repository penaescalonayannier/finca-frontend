// src/types/Contabilidad.ts

export type TipoCuenta = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO' | 'COSTO'
export type NaturalezaCuenta = 'DEUDORA' | 'ACREEDORA'

export interface CuentaContable {
  id: string
  codigo: string
  nombre: string
  tipo: TipoCuenta
  naturaleza: NaturalezaCuenta
  nivel: number
  cuentaPadreId?: string
  cuentaPadreCodigo?: string
  cuentaPadreNombre?: string
  permiteMovimiento: boolean
  esCentroCosto: boolean
  activo: boolean
  descripcion?: string
}

export interface CuentaContableRequest {
  codigo: string
  nombre: string
  descripcion?: string
  tipo: TipoCuenta
  naturaleza: NaturalezaCuenta
  nivel: number
  cuentaPadreId?: string
  permiteMovimiento: boolean
  esCentroCosto: boolean
  activo: boolean
}

export interface LineaAsiento {
  id: string
  asientoId: string
  codigoCuenta: string
  nombreCuenta: string
  centroCosto?: string
  debe: number
  haber: number
  concepto?: string
  orden: number
}

export interface AsientoContable {
  id: string
  numero: string
  fecha: string
  descripcion?: string
  movimientoStockId?: string
  tablaOrigen?: string
  totalDebe: number
  totalHaber: number
  asentado: boolean
  fechaAsentado?: string
  usuarioAsento?: string
  reglaId?: string
  lineas: LineaAsiento[]
}

export interface ReglaContabilizacion {
  id?: string
  tipoMovimiento: string
  almacenId?: string
  fincaId?: string
  tipoProducto?: string
  cuentaDebito: string
  cuentaCredito: string
  centroCostoDebito?: string
  centroCostoCredito?: string
  descripcionPlantilla?: string
  prioridad: number
  activo: boolean
}

export interface AsientoContableResponse {
  items: AsientoContable[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface TotalesPeriodo {
  totalDebito: number
  totalCredito: number
  diferencia: number
}

export interface MovimientoMayor {
  id: string
  fecha: string
  numeroAsiento: string
  concepto: string
  debe: number
  haber: number
  centroCosto?: string
}

export interface MayorPorCuenta {
  codigoCuenta: string
  fechaInicio: string
  fechaFin: string
  movimientos: MovimientoMayor[]
  totalDebe: number
  totalHaber: number
  saldo: number
}

export interface BalanceCuenta {
  codigoCuenta: string
  nombreCuenta?: string
  debe: number
  haber: number
  saldoDeudor: number
  saldoAcreedor: number
}

export interface BalanceComprobacion {
  fechaInicio: string
  fechaFin: string
  cuentas: BalanceCuenta[]
  totalDebe: number
  totalHaber: number
  cuadrado: boolean
}

export const TIPO_CUENTA_LABELS: Record<TipoCuenta, string> = {
  ACTIVO: 'Activo',
  PASIVO: 'Pasivo',
  PATRIMONIO: 'Patrimonio',
  INGRESO: 'Ingreso',
  GASTO: 'Gasto',
  COSTO: 'Costo'
}

export const TIPO_CUENTA_COLORS: Record<TipoCuenta, string> = {
  ACTIVO: 'primary',
  PASIVO: 'danger',
  PATRIMONIO: 'success',
  INGRESO: 'info',
  GASTO: 'warning',
  COSTO: 'secondary'
}

export const NATURALEZA_LABELS: Record<NaturalezaCuenta, string> = {
  DEUDORA: 'Deudora',
  ACREEDORA: 'Acreedora'
}
