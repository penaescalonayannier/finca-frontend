import axios from 'axios'
import type { TomaPrestamo, TomaPrestamoRequest } from '@/types/TomaPrestamo'

const API_BASE_URL = '/api/toma-prestamo'

// Interfaz para los filtros de búsqueda
interface SearchFilter {
  key: string
  operator: 'EQUALS' | 'LIKE' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS'
  value: any
  logicalOperation?: 'AND' | 'OR'
}

// Interfaz para respuesta paginada del backend (basado en kynsof-share)
interface PaginatedResponse<T> {
  data: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

class TomaPrestamoService {
  /**
   * Crear una nueva toma de préstamo
   */
  async create(tomaPrestamo: TomaPrestamoRequest): Promise<TomaPrestamo> {
    const response = await axios.post(API_BASE_URL, tomaPrestamo)
    return response.data
  }

  /**
   * Obtener toma de préstamo por ID
   */
  async getById(id: string): Promise<TomaPrestamo> {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  }

  /**
   * Actualizar toma de préstamo
   */
  async update(id: string, tomaPrestamo: TomaPrestamoRequest): Promise<TomaPrestamo> {
    const response = await axios.put(`${API_BASE_URL}/${id}`, tomaPrestamo)
    return response.data
  }

  /**
   * Eliminar toma de préstamo
   */
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/${id}`)
  }

  /**
   * Buscar tomas de préstamo con paginación
   */
  async search(
    page: number,
    size: number,
    filters: SearchFilter[] = [],
    sortBy = 'fecha',
    sortType: 'ASC' | 'DES' = 'DES'
  ): Promise<PaginatedResponse<TomaPrestamo>> {
    // Construir el cuerpo de la petición según lo espera el backend
    const requestBody = {
      page: page,
      pageSize: size,
      filter: filters,
      query: '',
      sortBy: sortBy,
      sortType: sortType
    }

    const response = await axios.post(`${API_BASE_URL}/search`, requestBody)
    return response.data
  }

  /**
   * Método alternativo para búsqueda con query string (mantener compatibilidad)
   */
  async buscarTomaPrestamos(params: any): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/search`, params)
    return response.data
  }

  /**
   * Exportar respaldo cultural
   */
  async exportRespaldoCultural(id: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/${id}/export-respaldo-cultural`, {
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * Exportar solicitud de disposición
   */
  async exportSolicitudDisposicion(id: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/${id}/export-solicitud-disposicion`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default new TomaPrestamoService()