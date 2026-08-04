import axios from 'axios'
import type {
  AbsentismoListResponse,
  ProductividadListResponse,
  RankingsListResponse,
  HorasExcedidasSummaryListResponse,
  DashboardResponse
} from '@/types/Metricas'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const ReportesMetricasService = {
  /**
   * Obtiene el reporte de ausentismo
   */
  obtenerAbsentismo(year: string, mes: string, trabajadorId?: string) {
    const params: any = { year, mes }
    if (trabajadorId) {
      params.trabajadorId = trabajadorId
    }
    return api.get<AbsentismoListResponse>('/reporte/metricas/ausentismo', { params })
  },

  /**
   * Obtiene el reporte de productividad
   */
  obtenerProductividad(year: string, mes: string, trabajadorId?: string) {
    const params: any = { year, mes }
    if (trabajadorId) {
      params.trabajadorId = trabajadorId
    }
    return api.get<ProductividadListResponse>('/reporte/metricas/productividad', { params })
  },

  /**
   * Obtiene el reporte de rankings
   */
  obtenerRankings(year: string, mes: string, cargo?: string) {
    const params: any = { year, mes }
    if (cargo) {
      params.cargo = cargo
    }
    return api.get<RankingsListResponse>('/reporte/metricas/rankings', { params })
  },

  /**
   * Obtiene el reporte de horas excedidas
   */
  obtenerHorasExceditasSummary(year: string, mes: string) {
    return api.get<HorasExcedidasSummaryListResponse>('/reporte/metricas/horas-excedidas-summary', {
      params: { year, mes }
    })
  },

  /**
   * Obtiene el dashboard consolidado con todos los reportes
   */
  obtenerDashboard(year: string, mes: string) {
    return api.get<DashboardResponse>('/reporte/dashboard', {
      params: { year, mes }
    })
  }
}

export default ReportesMetricasService
