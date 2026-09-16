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

export interface TarjetaEstibaPdfParams {
  almacenId: string
  fincaProductoId: string
  fechaInicio: string
  fechaFin: string
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

  async descargarConsolidadoPdf(fechaInicio: string, fechaFin: string, fincaId?: string): Promise<void> {
    const params: Record<string, string> = { fechaInicio, fechaFin }
    if (fincaId) params.fincaId = fincaId
    const response = await axios.get(`${API_BASE_URL}/consolidado/pdf`, { params, responseType: 'blob' })
    const contentDisposition = response.headers['content-disposition'] as string | undefined
    const filename = contentDisposition?.match(/filename="?([^";]+)"?/)?.[1]
      || `Reporte_movimientos_por_destino_${fechaInicio}_${fechaFin}.pdf`
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Descarga la Tarjeta de Estiba de un producto dentro de un almacén para el
   * período indicado. El recurso es de consulta: no registra movimientos ni
   * modifica existencias.
   */
  async descargarTarjetaEstibaPdf(params: TarjetaEstibaPdfParams): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/tarjeta-estiba/pdf`, {
      params,
      responseType: 'blob'
    })
    const contentDisposition = response.headers['content-disposition'] as string | undefined
    const encodedFilename = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    const filename = encodedFilename
      ? decodeURIComponent(encodedFilename)
      : contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
        || `Tarjeta_de_estiba_${params.fechaInicio}_${params.fechaFin}.pdf`
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
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
