import axios from 'axios'
import type {
  AbsentismoListResponse,
  ProductividadListResponse,
  RankingsListResponse,
  HorasExcedidasSummaryListResponse,
  DashboardResponse
} from '@/types/Metricas'

const API_BASE_URL = '/api/reporte'

const ReportesMetricasService = {
  /**
   * Obtiene el reporte de ausentismo
   */
  obtenerAbsentismo(year: string, mes: string, trabajadorId?: string) {
    const params: Record<string, string> = { year, mes }
    if (trabajadorId) {
      params.trabajadorId = trabajadorId
    }
    return axios.get<AbsentismoListResponse>(`${API_BASE_URL}/metricas/ausentismo`, { params })
  },

  /**
   * Obtiene el reporte de productividad
   */
  obtenerProductividad(year: string, mes: string, trabajadorId?: string) {
    const params: Record<string, string> = { year, mes }
    if (trabajadorId) {
      params.trabajadorId = trabajadorId
    }
    return axios.get<ProductividadListResponse>(`${API_BASE_URL}/metricas/productividad`, { params })
  },

  /**
   * Obtiene el reporte de rankings
   */
  obtenerRankings(year: string, mes: string, cargo?: string) {
    const params: Record<string, string> = { year, mes }
    if (cargo) {
      params.cargo = cargo
    }
    return axios.get<RankingsListResponse>(`${API_BASE_URL}/metricas/rankings`, { params })
  },

  /**
   * Obtiene el reporte de horas excedidas
   */
  obtenerHorasExceditasSummary(year: string, mes: string) {
    return axios.get<HorasExcedidasSummaryListResponse>(`${API_BASE_URL}/metricas/horas-excedidas-summary`, {
      params: { year, mes }
    })
  },

  /**
   * Obtiene el dashboard consolidado con todos los reportes
   */
  obtenerDashboard(year: string, mes: string) {
    return axios.get<DashboardResponse>(`${API_BASE_URL}/dashboard`, {
      params: { year, mes }
    })
  }
}

export default ReportesMetricasService
