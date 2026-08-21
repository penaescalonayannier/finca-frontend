import axios, { AxiosResponse } from 'axios'
import type { Campos, CamposRequest } from '@/types/Campos'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/campos'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class CamposService {
  crearCampos(campos: CamposRequest): Promise<AxiosResponse<Campos>> {
    return axios.post(API_BASE_URL, campos)
  }

  obtenerCamposPorId(id: string): Promise<AxiosResponse<Campos>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizarCampos(id: string, campos: CamposRequest): Promise<AxiosResponse<Campos>> {
    return axios.put(`${API_BASE_URL}/${id}`, campos)
  }

  eliminarCampos(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscarCampos(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Campos>>> {
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
}

export default new CamposService()
