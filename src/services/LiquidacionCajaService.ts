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
}

export interface EntregaBancoRequest {
  fincaId: string
  importe: number
  fecha?: string
  referenciaBancaria: string
  entregadoPor?: string
  recibidoPor?: string
  observaciones?: string
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
}

export default new LiquidacionCajaService()
