import axios, { type AxiosResponse } from 'axios'

const BASE_URL = '/api/liquidaciones-salida'

export interface ItemSalidaPendiente {
  itemSalidaId: string
  trabajadorId?: string
  trabajadorNombre?: string
  productoNombre?: string
  cantidad: number
  precio: number
  importeTotal: number
  importeCobrado: number
  saldoPendiente: number
}

export interface SalidaPendienteLiquidacion {
  salidaId: string
  numero: string
  tipo: 'VALE' | 'FACTURA' | string
  destino?: string
  fecha: string
  fincaNombre?: string
  importeTotal: number
  importeCobrado: number
  saldoPendiente: number
  estadoCobro: 'PENDIENTE' | 'PARCIAL' | 'COBRADO' | string
  items: ItemSalidaPendiente[]
}

export interface AplicacionLiquidacion {
  itemSalidaId: string
  importe: number
  formaPago: 'EFECTIVO' | 'TRANSFERENCIA'
  referenciaBancaria?: string
  /** Compatibilidad para pagos exactos en efectivo, sin vuelto. */
  denominaciones?: DenominacionCantidad[]
  /** Billetes recibidos del cliente, incluido cualquier excedente que origine vuelto. */
  denominacionesRecibidas?: DenominacionCantidad[]
  /** Billetes devueltos al cliente como cambio. */
  denominacionesVuelto?: DenominacionCantidad[]
}

export interface DenominacionCantidad {
  denominacion: number
  cantidad: number
}

export interface LiquidarSalidaRequest {
  salidaId: string
  entregadoPor?: string
  recibidoPor?: string
  observaciones?: string
  aplicaciones: AplicacionLiquidacion[]
}

export interface SaldoCaja {
  fincaId: string
  efectivoCobrado: number
  entregadoBanco: number
  saldoDisponible: number
  /** Existencia física controlada desde la apertura y los cobros desglosados. */
  denominaciones?: DenominacionCantidad[]
  /** Efectivo histórico cuya composición física no fue registrada. */
  pendienteSinDesglose?: number
}

export interface EntregaBancoRequest {
  fincaId: string
  importe: number
  fecha?: string
  referenciaBancaria: string
  entregadoPor?: string
  recibidoPor?: string
  observaciones?: string
  denominaciones?: DenominacionCantidad[]
}

export interface AperturaCajaRequest {
  fincaId: string
  fecha?: string
  observaciones?: string
  denominaciones: DenominacionCantidad[]
}

export interface CambioDenominacionesRequest {
  fincaId: string
  fecha?: string
  observaciones?: string
  denominacionesEntregadas: DenominacionCantidad[]
  denominacionesRecibidas: DenominacionCantidad[]
}

export interface EntregaBancoHistorial {
  id: string
  fincaId: string
  fecha: string
  importe: number
  referenciaBancaria?: string
  entregadoPor?: string
  recibidoPor?: string
  observaciones?: string
  denominaciones?: DenominacionCantidad[]
}

class LiquidacionCajaService {
  pendientes(fincaId: string, fechaInicio: string, fechaFin: string): Promise<AxiosResponse<SalidaPendienteLiquidacion[]>> {
    return axios.get(`${BASE_URL}/pendientes`, { params: { fincaId, fechaInicio, fechaFin } })
  }

  liquidar(data: LiquidarSalidaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(BASE_URL, data)
  }

  obtenerSaldoCaja(fincaId: string): Promise<AxiosResponse<SaldoCaja>> {
    return axios.get(`${BASE_URL}/caja/saldo`, { params: { fincaId } })
  }

  entregarAlBanco(data: EntregaBancoRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${BASE_URL}/caja/entregas-banco`, data)
  }

  listarEntregasBanco(fincaId: string): Promise<AxiosResponse<EntregaBancoHistorial[]>> {
    return axios.get(`${BASE_URL}/caja/entregas-banco`, { params: { fincaId } })
  }

  registrarApertura(data: AperturaCajaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${BASE_URL}/caja/apertura`, data)
  }

  cambiarDenominaciones(data: CambioDenominacionesRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${BASE_URL}/caja/cambios-denominaciones`, data)
  }
}

export default new LiquidacionCajaService()
