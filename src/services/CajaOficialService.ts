import axios, { type AxiosResponse } from 'axios'

const BASE_URL = '/api/caja-oficial'

export interface FondoCaja {
  id: string
  fincaId: string
  tipo: 'CAMBIO' | 'PAGOS_MENORES' | 'NOMINA' | 'POR_DEPOSITAR' | string
  importeAutorizado: number
  activo: boolean
  observaciones?: string
}

export interface FondoCajaRequest {
  fincaId: string
  tipo: FondoCaja['tipo']
  importeAutorizado: number
  observaciones?: string
}

export interface ResponsabilidadCaja {
  id: string
  numero?: number
  fincaId: string
  custodioId?: string
  custodioNombre: string
  fechaInicio: string
  fechaCierre?: string
  estado: 'ACTIVA' | 'CERRADA' | string
  observaciones?: string
}

export interface ResponsabilidadCajaRequest {
  fincaId: string
  custodioId?: string
  custodioNombre: string
  observaciones?: string
}

export interface CerrarResponsabilidadRequest { observaciones?: string }

export interface IncidenciaArqueo {
  id: string
  fincaId: string
  arqueoId: string
  tipo: 'FALTANTE' | 'SOBRANTE' | string
  importe: number
  expediente: string
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RESUELTA' | 'RECHAZADA' | string
  fechaCreacion: string
  fechaResolucion?: string
  descripcion?: string
  observaciones?: string
}

export interface IncidenciaArqueoRequest {
  arqueoCajaId: string
  expediente: string
  descripcion?: string
}

export interface TableroCajaOficial {
  arqueosDelMes?: number
  arqueosCerrados?: number
  arqueosAbiertos?: number
  cumplimientoArqueoMensual?: boolean
  saldoPorDepositar?: number
  depositoPendiente?: boolean
  fondoCambioAutorizado?: number
  fondoPagosMenoresAutorizado?: number
  fondoNominaAutorizado?: number
  incidenciasPendientes?: number
}

class CajaOficialService {
  listarFondos(fincaId: string): Promise<AxiosResponse<FondoCaja[]>> { return axios.get(`${BASE_URL}/fondos`, { params: { fincaId } }) }
  crearFondo(data: FondoCajaRequest): Promise<AxiosResponse<{ id: string }>> { return axios.post(`${BASE_URL}/fondos`, data) }
  listarResponsabilidades(fincaId: string): Promise<AxiosResponse<ResponsabilidadCaja[]>> { return axios.get(`${BASE_URL}/responsabilidades`, { params: { fincaId } }) }
  crearResponsabilidad(data: ResponsabilidadCajaRequest): Promise<AxiosResponse<{ id: string }>> { return axios.post(`${BASE_URL}/responsabilidades`, data) }
  cerrarResponsabilidad(id: string, data: CerrarResponsabilidadRequest): Promise<AxiosResponse<void>> { return axios.put(`${BASE_URL}/responsabilidades/${id}/cerrar`, data) }
  listarIncidencias(fincaId: string): Promise<AxiosResponse<IncidenciaArqueo[]>> { return axios.get(`${BASE_URL}/incidencias-arqueo`, { params: { fincaId } }) }
  crearIncidencia(data: IncidenciaArqueoRequest): Promise<AxiosResponse<{ id: string }>> { return axios.post(`${BASE_URL}/incidencias-arqueo`, data) }
  actualizarIncidencia(id: string, data: { estado: string; observaciones?: string }): Promise<AxiosResponse<void>> { return axios.put(`${BASE_URL}/incidencias-arqueo/${id}`, data) }
  tablero(fincaId: string, anio: number, mes: number): Promise<AxiosResponse<TableroCajaOficial>> { return axios.get(`${BASE_URL}/tablero`, { params: { fincaId, anio, mes } }) }
}

export default new CajaOficialService()
