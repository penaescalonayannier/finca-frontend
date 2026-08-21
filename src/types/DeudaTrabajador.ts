export interface DeudaTrabajador {
  id?: string
  trabajadorId: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  importe: number
}

export interface DeudaTrabajadorRequest {
  trabajadorId: string
  importe: number
}

export type TipoMovimiento = 'COMPRA' | 'PAGO'

export interface DeudaTrabajadorDetalle {
  id: string
  trabajadorId: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  salidaId?: string
  salidaNumero?: string
  salidaTipo?: 'VALE' | 'FACTURA'
  productoId?: string
  productoCodigo?: string
  productoNombre?: string
  cantidad?: number
  precioUnitario?: number
  importe: number
  fecha: string
  activo: boolean
  pagado: boolean
  tipoMovimiento?: TipoMovimiento
  formaPago?: FormaPago
  referenciaBancaria?: string
}

export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA'

export interface PagoDeuda {
  id: string
  trabajadorId: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  monto: number
  formaPago: FormaPago
  referenciaBancaria?: string
  fecha: string
}

export interface RegistrarPagoRequest {
  trabajadorId: string
  monto: number
  formaPago: FormaPago
  referenciaBancaria?: string
}
