// src/services/FincaProductoService.ts

import axios, { AxiosResponse } from 'axios'
import type {
  FincaProducto,
  FincaProductoResponse,
  AsignarProductoRequest,
  ActualizarStockRequest,
  RemoverProductoRequest,
  EntradaProduccionRequest,
  EntradaProduccionResponse
} from '@/types/FincaProducto'
import type { SearchFilter, PagedResponse } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/finca-producto'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class FincaProductoService {
  // ==================== COMMANDS ====================

  /**
   * Asignar un producto a una finca
   */
  asignarProductoAFinca(data: AsignarProductoRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${API_BASE_URL}/asignar`, data)
  }

  /**
   * Actualizar stock de un producto en una finca
   */
  actualizarStock(data: ActualizarStockRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.put(`${API_BASE_URL}/stock`, data)
  }

  /**
   * Registrar entrada de producción (suma cantidad al stock existente)
   */
  entradaProduccion(data: EntradaProduccionRequest): Promise<AxiosResponse<EntradaProduccionResponse>> {
    return axios.post(`${API_BASE_URL}/entrada-produccion`, data)
  }

  /**
   * Remover un producto de una finca
   */
  removerProductoDeFinca(data: RemoverProductoRequest): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/remover`, { data })
  }

  /**
   * Remover todos los productos de una finca
   */
  removerTodosProductosDeFinca(fincaId: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/finca/${fincaId}/todos`)
  }

  // ==================== QUERIES ====================

  /**
   * Búsqueda paginada de todas las relaciones Finca-Producto
   */
  searchFincaProductos(params: SearchParams): Promise<AxiosResponse<PagedResponse<FincaProducto>>> {
    const requestBody = {
      filter: params.filter || [],
      query: params.query || '',
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: params.sortBy || 'id',
      sortType: params.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Obtener todos los productos de una finca
   */
  obtenerProductosDeFinca(fincaId: string): Promise<AxiosResponse<FincaProductoResponse>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}/productos/activos`)
  }

  /**
   * Obtener todas las fincas de un producto
   */
  obtenerFincasDeProducto(productoId: string): Promise<AxiosResponse<FincaProductoResponse>> {
    return axios.get(`${API_BASE_URL}/producto/${productoId}`)
  }

  /**
   * Obtener una relación específica Finca-Producto
   */
  obtenerRelacion(fincaId: string, productoId: string): Promise<AxiosResponse<FincaProducto>> {
    return axios.get(`${API_BASE_URL}/relacion`, {
      params: { fincaId, productoId }
    })
  }

  /**
   * Obtener stock de un producto en una finca específica
   */
  obtenerStock(fincaId: string, productoId: string): Promise<AxiosResponse<number>> {
    return axios.get(`${API_BASE_URL}/stock`, {
      params: { fincaId, productoId }
    })
  }

  // ==================== ENDPOINTS ADICIONALES ====================

  /**
   * Obtener productos activos de una finca
   */
  obtenerProductosActivosDeFinca(fincaId: string): Promise<AxiosResponse<FincaProductoResponse>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}/productos/activos`)
  }

  /**
   * Obtener stock total de una finca (suma de todos sus productos)
   */
  obtenerStockTotalDeFinca(fincaId: string): Promise<AxiosResponse<number>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}/stock-total`)
  }

  /**
   * Obtener stock total de un producto en todas las fincas
   */
  obtenerStockTotalDeProducto(productoId: string): Promise<AxiosResponse<number>> {
    return axios.get(`${API_BASE_URL}/producto/${productoId}/stock-total`)
  }

  /**
   * Contar productos de una finca
   */
  contarProductosDeFinca(fincaId: string): Promise<AxiosResponse<number>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}/count`)
  }
}

export default new FincaProductoService()