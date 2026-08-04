import axios, { AxiosResponse } from 'axios'
import type { Prestamo, PrestamoRequest } from '@/types/Prestamo'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/prestamo'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DESC'
}

class PrestamoService {
  crearPrestamo(prestamo: PrestamoRequest): Promise<AxiosResponse<Prestamo>> {
    return axios.post(API_BASE_URL, prestamo)
  }

  obtenerPrestamoPorId(id: string): Promise<AxiosResponse<Prestamo>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizarPrestamo(id: string, prestamo: PrestamoRequest): Promise<AxiosResponse<Prestamo>> {
    return axios.put(`${API_BASE_URL}/${id}`, prestamo)
  }

  eliminarPrestamo(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscarPrestamos(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Prestamo>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || '',
      sortType: filtros.sortType || 'ASC'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export default new PrestamoService()
