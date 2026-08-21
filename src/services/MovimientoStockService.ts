// src/services/MovimientoStockService.ts

import axios, { AxiosResponse } from 'axios'
import type { MovimientoStock } from '@/types/MovimientoStock'
import type { SearchFilter, PagedResponse } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/movimiento-stock'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class MovimientoStockService {
  /**
   * Búsqueda paginada de movimientos de stock
   */
  search(params: SearchParams): Promise<AxiosResponse<PagedResponse<MovimientoStock>>> {
    const requestBody = {
      filter: params.filter || [],
      query: params.query || '',
      pageSize: params.size || 20,
      page: params.page || 0,
      sortBy: params.sortBy || 'fecha',
      sortType: params.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Obtener movimientos de un FincaProducto específico
   */
  findByFincaProductoId(fincaProductoId: string): Promise<AxiosResponse<MovimientoStock[]>> {
    return axios.get(`${API_BASE_URL}/finca-producto/${fincaProductoId}`)
  }

  /**
   * Obtener movimientos de una finca
   */
  findByFincaId(fincaId: string): Promise<AxiosResponse<MovimientoStock[]>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}`)
  }

  /**
   * Obtener movimientos de un producto
   */
  findByProductoId(productoId: string): Promise<AxiosResponse<MovimientoStock[]>> {
    return axios.get(`${API_BASE_URL}/producto/${productoId}`)
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  findByFincaIdAndFechaBetween(
    fincaId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<AxiosResponse<MovimientoStock[]>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}/rango`, {
      params: { fechaInicio, fechaFin }
    })
  }
}

export default new MovimientoStockService()
