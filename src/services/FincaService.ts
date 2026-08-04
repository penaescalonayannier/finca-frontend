// src/services/FincaService.ts

import axios, { AxiosResponse } from 'axios'
import type { Finca, FincaRequest } from '@/types/Finca'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/finca'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DESC'
}

interface ImportResponse {
  status?: string
  message?: string
  count?: number
}

class FincaService {
  crearFinca(finca: FincaRequest): Promise<AxiosResponse<Finca>> {
    return axios.post(API_BASE_URL, finca)
  }

  obtenerFincaPorId(id: string): Promise<AxiosResponse<Finca>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizarFinca(id: string, finca: FincaRequest): Promise<AxiosResponse<Finca>> {
    return axios.put(`${API_BASE_URL}/${id}`, finca)
  }

  eliminarFinca(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscarFincas(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Finca>>> {
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

  importarCsv(file: File): Promise<AxiosResponse<ImportResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    return axios.post(`${API_BASE_URL}/import-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  exportarFincas(ids: string[]): Promise<AxiosResponse<Blob>> {
    return axios.post(`${API_BASE_URL}/export`, ids, {
      responseType: 'blob'
    })
  }

  obtenerFincaPorCodigo(code: string): Promise<AxiosResponse<Finca>> {
    return axios.get(`${API_BASE_URL}/code/${code}`)
  }
}

export default new FincaService()