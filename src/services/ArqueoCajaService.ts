import axios, { type AxiosResponse } from 'axios'
import type { DenominacionCantidad } from './LiquidacionCajaService'

const BASE_URL = '/api/arqueos-caja'

export interface DetalleArqueoCaja {
  denominacion: number
  cantidadEsperada: number
  cantidadFisica?: number
  diferenciaCantidad?: number
  importeEsperado: number
  importeFisico?: number
  diferenciaImporte?: number
}

export interface ArqueoCaja {
  id: string
  numero?: string
  tipo?: 'PARCIAL' | 'TOTAL' | string
  fincaId: string
  fechaApertura: string
  fechaCierre?: string
  contadorResponsable?: string
  observaciones?: string
  estado: 'ABIERTO' | 'CERRADO' | string
  totalEsperado: number
  totalFisico?: number
  diferencia?: number
  denominaciones: DetalleArqueoCaja[]
}

export interface CrearArqueoCajaRequest {
  fincaId: string
  fecha?: string
  contadorResponsable?: string
  custodio?: string
  recibidoPor?: string
  observaciones?: string
  muestraDenominaciones: number[]
}

export interface CerrarArqueoCajaRequest {
  conteoFisico: DenominacionCantidad[]
  observaciones?: string
}

class ArqueoCajaService {
  listar(fincaId: string): Promise<AxiosResponse<ArqueoCaja[]>> {
    return axios.get(BASE_URL, { params: { fincaId } })
  }

  crear(data: CrearArqueoCajaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(BASE_URL, data)
  }

  obtener(id: string): Promise<AxiosResponse<ArqueoCaja>> {
    return axios.get(`${BASE_URL}/${id}`)
  }

  cerrar(id: string, data: CerrarArqueoCajaRequest): Promise<AxiosResponse<void>> {
    return axios.put(`${BASE_URL}/${id}/cerrar`, data)
  }

  descargarPdf(id: string): Promise<AxiosResponse<Blob>> {
    return axios.get(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' })
  }
}

export default new ArqueoCajaService()
