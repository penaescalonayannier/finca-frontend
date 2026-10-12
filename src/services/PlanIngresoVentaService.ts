import axios, { type AxiosResponse } from 'axios'
import type { EjecucionPlanMensual, EstadoPlanIngresoVenta, PlanIngresoVenta, PlanIngresoVentaRequest } from '@/types/PlanIngresoVenta'

const API_BASE_URL = '/api/plan-ingreso-venta'

interface ResultadoPaginado<T> {
  data: T[]
  totalElements?: number
  totalPages?: number
  page?: number
}

class PlanIngresoVentaService {
  buscar(page = 0, pageSize = 300): Promise<AxiosResponse<ResultadoPaginado<PlanIngresoVenta>>> {
    return axios.post(`${API_BASE_URL}/search`, {
      filter: [], query: '', page, pageSize, sortBy: 'periodo', sortType: 'DES'
    })
  }

  obtener(id: string): Promise<AxiosResponse<PlanIngresoVenta>> { return axios.get(`${API_BASE_URL}/${id}`) }
  crear(datos: PlanIngresoVentaRequest): Promise<AxiosResponse<{ id: string }>> { return axios.post(API_BASE_URL, datos) }
  actualizar(id: string, datos: PlanIngresoVentaRequest): Promise<AxiosResponse<{ id: string }>> { return axios.put(`${API_BASE_URL}/${id}`, datos) }
  eliminar(id: string): Promise<AxiosResponse<void>> { return axios.delete(`${API_BASE_URL}/${id}`) }
  generarSiguiente(periodo: string): Promise<AxiosResponse<{ id: string }>> { return axios.post(`${API_BASE_URL}/generar-siguiente`, undefined, { params: { periodo } }) }
  cambiarEstado(id: string, estado: EstadoPlanIngresoVenta): Promise<AxiosResponse<PlanIngresoVenta>> { return axios.put(`${API_BASE_URL}/${id}/estado`, { estado }) }
  ejecucion(id: string): Promise<AxiosResponse<EjecucionPlanMensual>> { return axios.get(`${API_BASE_URL}/${id}/ejecucion`) }
}

export default new PlanIngresoVentaService()
