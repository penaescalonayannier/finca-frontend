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

export interface AjusteStockRequest {
  almacenId: string
  fincaProductoId: string
  tipoMovimiento: 'ENTRADA_AJUSTE' | 'SALIDA_AJUSTE'
  cantidad: number
  observaciones: string
}

export interface AjusteStockResponse {
  id: string
  stockAnterior: number
  stockNuevo: number
}

class MovimientoStockService {
  crearAjuste(data: AjusteStockRequest): Promise<AxiosResponse<AjusteStockResponse>> {
    return axios.post(`${API_BASE_URL}/ajuste`, data)
  }

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

  /**
   * Obtener reporte consolidado de movimientos por rango de fechas
   * Agrupa entradas por producto y salidas por destino
   */
  getConsolidado(
    fechaInicio: string,
    fechaFin: string,
    fincaId?: string
  ): Promise<AxiosResponse<ReporteConsolidado>> {
    const params: Record<string, string> = { fechaInicio, fechaFin }
    if (fincaId) {
      params.fincaId = fincaId
    }
    return axios.get(`${API_BASE_URL}/consolidado`, { params })
  }
}

// Types for consolidated report
export interface EntradaDetalle {
  tipo: string
  cantidad: number
  descripcion: string
}

export interface EntradaPorProducto {
  productoCode: string
  productoName: string
  unidadMedida: string
  cantidadTotal: number
  detalles: EntradaDetalle[]
}

export interface SalidaProductoDetalle {
  productoCode: string
  productoName: string
  cantidad: number
  precio: number
  valorTotal: number
}

export interface SalidaPorDestino {
  destino: string
  destinoNombre: string
  cantidadTotal: number
  valorTotal: number
  productos: SalidaProductoDetalle[]
}

export interface ReporteConsolidado {
  fechaInicio: string
  fechaFin: string
  totalEntradas: number
  totalSalidas: number
  entradasPorProducto: EntradaPorProducto[]
  salidasPorDestino: SalidaPorDestino[]
  entradasPorTipo: Record<string, number>
}

export default new MovimientoStockService()
