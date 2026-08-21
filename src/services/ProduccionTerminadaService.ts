// src/services/ProduccionTerminadaService.ts

import axios, { AxiosResponse } from 'axios'
import type {
  ProduccionTerminada,
  CreateProduccionTerminadaRequest,
  UpdateProduccionTerminadaRequest,
  ProduccionTerminadaResponse
} from '@/types/ProduccionTerminada'
import type { SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/produccion-terminada'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class ProduccionTerminadaService {
  // Crear nueva producción terminada
  create(data: CreateProduccionTerminadaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(API_BASE_URL, data)
  }

  // Actualizar producción terminada
  update(id: string, data: UpdateProduccionTerminadaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.put(`${API_BASE_URL}/${id}`, data)
  }

  // Eliminar producción terminada
  delete(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  // Obtener por ID
  findById(id: string): Promise<AxiosResponse<ProduccionTerminada>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  // Búsqueda paginada
  search(params: SearchParams): Promise<AxiosResponse<ProduccionTerminadaResponse>> {
    const sortType = params.sortType || 'DES'
    const requestBody = {
      filter: params.filter || [],
      query: params.query || '',
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: params.sortBy || 'fecha',
      sortType: sortType
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export default new ProduccionTerminadaService()
