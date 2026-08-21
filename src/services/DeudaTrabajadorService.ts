import axios, { AxiosResponse } from 'axios'
import type { DeudaTrabajador, DeudaTrabajadorRequest, DeudaTrabajadorDetalle, PagoDeuda, RegistrarPagoRequest } from '@/types/DeudaTrabajador'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/deuda-trabajador'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class DeudaTrabajadorService {
  crear(deuda: DeudaTrabajadorRequest): Promise<AxiosResponse<DeudaTrabajador>> {
    return axios.post(API_BASE_URL, deuda)
  }

  obtenerPorId(id: string): Promise<AxiosResponse<DeudaTrabajador>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizar(id: string, deuda: DeudaTrabajadorRequest): Promise<AxiosResponse<DeudaTrabajador>> {
    return axios.put(`${API_BASE_URL}/${id}`, deuda)
  }

  eliminar(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscar(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<DeudaTrabajador>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || 'createdAt',
      sortType: filtros.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  obtenerDetalles(trabajadorId: string): Promise<AxiosResponse<DeudaTrabajadorDetalle[]>> {
    return axios.get(`${API_BASE_URL}/detalles/${trabajadorId}`)
  }

  registrarPago(pago: RegistrarPagoRequest): Promise<AxiosResponse<{ id: string; message: string }>> {
    return axios.post(`${API_BASE_URL}/pago`, pago)
  }

  obtenerPagos(trabajadorId: string): Promise<AxiosResponse<PagoDeuda[]>> {
    return axios.get(`${API_BASE_URL}/pagos/${trabajadorId}`)
  }

  buscarHistorial(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<DeudaTrabajadorDetalle>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 20,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || 'fecha',
      sortType: filtros.sortType === 'DES' ? 'DES' : 'ASC'
    }

    return axios.post(`${API_BASE_URL}/historial/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export default new DeudaTrabajadorService()
