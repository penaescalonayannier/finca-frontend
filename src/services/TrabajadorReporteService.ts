// src/services/TrabajadorReporteService.ts

import axios, { AxiosResponse } from 'axios'
import type { 
  TrabajadorReporte, 
  TrabajadorReporteRequest,
  AsignarTrabajadorRequest,
  ActualizarAsignacionRequest
} from '@/types/TrabajadorReporte'
import type { SearchFilter, PagedResponse } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/trabajdor-reporte'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

export interface TrabajadorReporteDetail {
  id: string
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  trabajadorCuenta: string
  trabajadorCargo: string
  reporteId: string
  reporteCodigo: string
  reporteBloque: string
  reporteCampo: string
  reporteArea: string
  reporteNorma: string
  reporteFecha: string
  reporteYear: string
  reporteMes: string
  norma: string
  horas: string
}

export interface TrabajadorReporteDetailListResponse {
  items: TrabajadorReporteDetail[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

class TrabajadorReporteService {
  // ==================== COMMANDS ====================

  /**
   * Asignar un trabajador a un reporte
   */
  asignarTrabajadorAReporte(data: AsignarTrabajadorRequest): Promise<AxiosResponse<{ id: string }>> {
    const request: TrabajadorReporteRequest = {
      trabajador: data.trabajadorId,
      reporte: data.reporteId,
      norma: data.norma,
      horas: data.horas
    }
    return axios.post(API_BASE_URL, request)
  }

  /**
   * Actualizar una asignación de trabajador a reporte
   */
  actualizarAsignacion(id: string, data: ActualizarAsignacionRequest): Promise<AxiosResponse<{ id: string }>> {
    const request: TrabajadorReporteRequest = {
      trabajador: data.trabajadorId,
      reporte: data.reporteId,
      norma: data.norma,
      horas: data.horas
    }
    return axios.put(`${API_BASE_URL}/${id}`, request)
  }

  /**
   * Eliminar una asignación de trabajador a reporte
   */
  eliminarAsignacion(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  // ==================== QUERIES ====================

  /**
   * Obtener una asignación por ID
   */
  obtenerAsignacionPorId(id: string): Promise<AxiosResponse<TrabajadorReporte>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  /**
   * Búsqueda paginada de asignaciones con filtros
   */
  buscarAsignaciones(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<TrabajadorReporte>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || 'id',
      sortType: filtros.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Obtener todas las asignaciones de un reporte específico con detalles completos
   */
  obtenerAsignacionesPorReporte(reporteId: string): Promise<AxiosResponse<TrabajadorReporteDetailListResponse>> {
    return axios.get(`${API_BASE_URL}/reporte/${reporteId}`)
  }

  /**
   * Obtener todas las asignaciones de un trabajador específico
   */
  obtenerAsignacionesPorTrabajador(trabajadorId: string): Promise<AxiosResponse<TrabajadorReporteDetailListResponse>> {
    return axios.get(`${API_BASE_URL}/trabajador/${trabajadorId}`)
  }
}

export default new TrabajadorReporteService()