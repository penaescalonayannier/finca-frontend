// src/services/TrabajadorService.ts

import axios, { AxiosResponse } from 'axios'
import type { Trabajador, TrabajadorRequest } from '@/types/Trabajador'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/trabajadores'

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

class TrabajadorService {
  crearTrabajador(trabajador: TrabajadorRequest): Promise<AxiosResponse<Trabajador>> {
    return axios.post(API_BASE_URL, trabajador)
  }

  obtenerTrabajadorPorId(id: string): Promise<AxiosResponse<Trabajador>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizarTrabajador(id: string, trabajador: TrabajadorRequest): Promise<AxiosResponse<Trabajador>> {
    return axios.put(`${API_BASE_URL}/${id}`, trabajador)
  }

  eliminarTrabajador(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscarTrabajadores(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Trabajador>>> {
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

  exportarTrabajadores(ids: string[]): Promise<AxiosResponse<Blob>> {
    return axios.post(`${API_BASE_URL}/export`, ids, {
      responseType: 'blob'
    })
  }

  getAll(): Promise<AxiosResponse<PagedResponse<Trabajador>>> {
    return this.buscarTrabajadores({
      size: 1000,
      page: 0,
      sortBy: 'nombre',
      sortType: 'ASC'
    })
  }

  asignarCargo(trabajadorId: string, cargoId: string): Promise<AxiosResponse<any>> {
    return axios.post(`${API_BASE_URL}/${trabajadorId}/asignar-cargo`, {
      cargoId
    })
  }

  asignarGrupo(trabajadorId: string, grupoId: string): Promise<AxiosResponse<any>> {
    return axios.post(`${API_BASE_URL}/${trabajadorId}/asignar-grupo`, {
      grupoId
    })
  }
}

export default new TrabajadorService()