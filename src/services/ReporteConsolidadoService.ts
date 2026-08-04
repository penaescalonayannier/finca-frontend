// src/services/ReporteConsolidadoService.ts

import axios, { AxiosResponse } from 'axios'
import type { ReporteConsolidado } from '@/types/ReporteConsolidado'
import type { ReporteConsolidadoPorResponsable } from '@/types/ReporteConsolidadoPorResponsable'

const API_BASE_URL = '/api/reporte'

class ReporteConsolidadoService {
  /**
   * Obtener reporte consolidado mensual
   */
  obtenerReporteConsolidado(year: string, mes: string): Promise<AxiosResponse<ReporteConsolidado>> {
    return axios.get(`${API_BASE_URL}/consolidado`, {
      params: { year, mes }
    })
  }

  /**
   * Obtener reporte consolidado por responsable mensual
   */
  obtenerReporteConsolidadoPorResponsable(year: string, mes: string): Promise<AxiosResponse<ReporteConsolidadoPorResponsable>> {
    return axios.get(`${API_BASE_URL}/consolidado-por-responsable`, {
      params: { year, mes }
    })
  }

  /**
   * Exportar reporte consolidado a PDF
   */
  exportarPdfConsolidado(year: string, mes: string): Promise<AxiosResponse<Blob>> {
    return axios.get(`${API_BASE_URL}/consolidado/pdf`, {
      params: { year, mes },
      responseType: 'blob'
    })
  }
}

export default new ReporteConsolidadoService()