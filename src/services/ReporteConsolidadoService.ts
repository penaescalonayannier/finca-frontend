// src/services/ReporteConsolidadoService.ts

import axios, { AxiosResponse } from 'axios'
import type { ReporteConsolidado } from '@/types/ReporteConsolidado'
import type { ReporteConsolidadoPorResponsable } from '@/types/ReporteConsolidadoPorResponsable'
import type { ReporteResponse } from '@/types/Reporte'

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

  /**
   * Obtener trabajadores activos no reportados en el consolidado
   */
  obtenerTrabajadoresFaltantes(year: string, mes: string): Promise<AxiosResponse<{ items: Array<{ id: string; nombre: string; cargo: string; grupo: string }> }>> {
    return axios.get(`${API_BASE_URL}/consolidado/trabajadores-faltantes`, {
      params: { year, mes }
    })
  }

  /**
   * Escribir horas en archivo de prenómina Excel
   */
  escribirPrenomina(nombreArchivo: string, horasPorRuc: Record<string, number>): Promise<AxiosResponse<Blob>> {
    return axios.post(`${API_BASE_URL}/consolidado/escribir-prenomina`, horasPorRuc, {
      params: { nombreArchivo },
      responseType: 'blob'
    })
  }

  /**
   * Obtener todos los reportes donde participó un trabajador en un mes/año
   */
  obtenerReportesPorTrabajador(trabajadorId: string, year: string, mes: string): Promise<AxiosResponse<ReporteResponse[]>> {
    return axios.get(`${API_BASE_URL}/por-trabajador/${trabajadorId}`, {
      params: { year, mes }
    })
  }
}

export default new ReporteConsolidadoService()