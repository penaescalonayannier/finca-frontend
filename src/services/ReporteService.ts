// src/services/ReporteService.ts

import axios, { AxiosResponse, AxiosError } from 'axios'
import type { Reporte, ReporteRequest } from '@/types/Reporte'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/reporte'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class ReporteService {
  // ==================== QUERIES ====================

  /**
   * Obtener el próximo código disponible para un año y mes
   */
  async getNextCodigo(year: string, mes: string): Promise<string> {
    const response = await axios.get(`${API_BASE_URL}/next-codigo`, {
      params: { year, mes }
    })
    return response.data.codigo
  }

  // ==================== COMMANDS ====================

  /**
   * Crear un nuevo reporte
   */
  crearReporte(reporte: ReporteRequest): Promise<AxiosResponse<Reporte>> {
    return axios.post(API_BASE_URL, reporte)
  }

  /**
   * Actualizar un reporte existente
   */
  actualizarReporte(id: string, reporte: ReporteRequest): Promise<AxiosResponse<Reporte>> {
    return axios.put(`${API_BASE_URL}/${id}`, reporte)
  }

  /**
   * Eliminar un reporte por ID
   */
  eliminarReporte(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  // ==================== QUERIES ====================

  /**
   * Obtener un reporte por ID
   */
  obtenerReportePorId(id: string): Promise<AxiosResponse<Reporte>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  /**
   * Búsqueda paginada de reportes con filtros
   */
  buscarReportes(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Reporte>>> {
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

  // ==================== PDF ====================

  /**
   * Generar PDF de un reporte
   */
  async generarPdfReporte(id: string): Promise<Blob> {
    try {
      console.log('📄 [Service] Generando PDF para reporte:', id)
      
      const response = await axios.get(`${API_BASE_URL}/${id}/pdf`, {
        responseType: 'blob',
        timeout: 30000 // 30 segundos de timeout
      })
      
      console.log('📄 [Service] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: response.data instanceof Blob ? 'Blob' : typeof response.data,
        dataSize: response.data instanceof Blob ? response.data.size : 'N/A'
      })
      
      // Si la respuesta es un blob, verificar que no sea un error
      if (response.data instanceof Blob) {
        // Verificar si es un PDF por el tipo
        if (response.data.type && response.data.type !== 'application/pdf') {
          // Si no es PDF, intentar leer el contenido como texto
          const text = await response.data.text()
          console.error('❌ [Service] Respuesta no PDF:', text)
          try {
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || errorData.error || 'Error al generar el PDF')
          } catch {
            throw new Error(text || 'Error al generar el PDF')
          }
        }
        
        // Si el blob está vacío
        if (response.data.size === 0) {
          throw new Error('El PDF generado está vacío')
        }
        
        return response.data
      }
      
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      console.error('❌ [Service] Error en generarPdfReporte:', axiosError)
      
      // Si hay respuesta, intentar leer el mensaje de error
      if (axiosError.response) {
        const responseData = axiosError.response.data
        console.log('📄 [Service] Datos de error:', responseData)
        
        if (responseData instanceof Blob) {
          const text = await responseData.text()
          console.error('📄 [Service] Error del servidor (texto):', text)
          try {
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || errorData.error || 'Error al generar el PDF')
          } catch {
            throw new Error(text || 'Error al generar el PDF')
          }
        } else if (typeof responseData === 'string') {
          throw new Error(responseData)
        } else if (typeof responseData === 'object' && responseData !== null) {
          const message = (responseData as any).message || (responseData as any).error || 'Error al generar el PDF'
          throw new Error(message)
        }
      }
      
      throw new Error(axiosError.message || 'Error al generar el PDF')
    }
  }
}

export default new ReporteService()