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

  // Descargar el modelo oficial SC-2-06 de una producción terminada
  async descargarPdf(id: string): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/${id}/pdf`, {
      responseType: 'blob'
    })

    const contentDisposition = response.headers['content-disposition'] as string | undefined
    const filenameMatch = contentDisposition?.match(
      /filename\*=UTF-8''([^;]+)|filename[^;=\n]*=((['"]).*?\3|[^;\n]*)/
    )
    const rawFilename = filenameMatch?.[1] || filenameMatch?.[2]
    const filename = rawFilename
      ? decodeURIComponent(rawFilename.replace(/["']/g, ''))
      : 'SC-2-06_Produccion_Terminada.pdf'

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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
