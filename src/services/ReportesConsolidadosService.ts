import axios, { AxiosResponse } from 'axios'
import type {
  ReporteDeudasPendientes,
  ReporteFacturacion,
  ReporteKardex,
  ReporteMovimientosGrafico,
  ResumenAlertas,
  ResumenPagos,
  ResumenVentas,
  TipoSalida,
  Granularidad
} from '@/types/Reportes'

const API_BASE_URL = '/api/reportes'
const API_FINCA_PRODUCTO_URL = '/api/finca-producto'

export interface DeudasParams {
  fincaId?: string
  montoMinimo?: number
  montoMaximo?: number
  incluirHistorial?: boolean
}

export interface FacturacionParams {
  fincaId?: string
  fechaInicio: string
  fechaFin: string
  tipo?: TipoSalida
  agruparPor?: 'FINCA' | 'TIPO' | 'DESTINO'
}

export interface KardexParams {
  fincaId: string
  fechaInicio: string
  fechaFin: string
  productoIds?: string[]
}

export interface GraficoParams {
  fincaId?: string
  productoId?: string
  fechaInicio: string
  fechaFin: string
  granularidad?: Granularidad
}

export interface AlertasParams {
  fincaId?: string
  estado?: string
  limit?: number
}

export interface PagosParams {
  fincaId?: string
  fechaInicio: string
  fechaFin: string
}

export interface VentasParams {
  fincaId?: string
  fechaInicio: string
  fechaFin: string
}

class ReportesConsolidadosService {
  // ==================== REPORTES ====================

  getDeudasPendientes(params: DeudasParams): Promise<AxiosResponse<ReporteDeudasPendientes>> {
    return axios.get(`${API_BASE_URL}/deudas-pendientes`, { params })
  }

  getFacturacion(params: FacturacionParams): Promise<AxiosResponse<ReporteFacturacion>> {
    return axios.get(`${API_BASE_URL}/facturacion`, { params })
  }

  getKardexConsolidado(params: KardexParams): Promise<AxiosResponse<ReporteKardex>> {
    return axios.get(`${API_BASE_URL}/kardex-consolidado`, { params })
  }

  getMovimientosGrafico(params: GraficoParams): Promise<AxiosResponse<ReporteMovimientosGrafico>> {
    return axios.get(`${API_BASE_URL}/movimientos-grafico`, { params })
  }

  // ==================== ALERTAS STOCK ====================

  getResumenAlertas(params: AlertasParams): Promise<AxiosResponse<ResumenAlertas>> {
    return axios.get(`${API_FINCA_PRODUCTO_URL}/alertas/resumen`, { params })
  }

  actualizarStockMinMax(
    id: string,
    stockMinimo?: number,
    stockMaximo?: number
  ): Promise<AxiosResponse<unknown>> {
    return axios.patch(`${API_FINCA_PRODUCTO_URL}/${id}/stock-minmax`, null, {
      params: { stockMinimo, stockMaximo }
    })
  }

  // ==================== RESUMEN PAGOS Y VENTAS ====================

  getResumenPagos(params: PagosParams): Promise<AxiosResponse<ResumenPagos>> {
    return axios.get(`${API_BASE_URL}/pagos`, { params })
  }

  getResumenVentas(params: VentasParams): Promise<AxiosResponse<ResumenVentas>> {
    return axios.get(`${API_BASE_URL}/ventas`, { params })
  }
}

export default new ReportesConsolidadosService()
