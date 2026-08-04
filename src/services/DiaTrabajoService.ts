// src/services/DiaTrabajoService.ts

import axios, { AxiosResponse } from 'axios'
import type { 
  DiaTrabajo, 
  DiaTrabajoRequest, 
  DiaTrabajoListResponse,
  TrabajadorDia,
  TrabajadorDiaListResponse
} from '@/types/DiaTrabajo'

const API_BASE_URL = '/api/reporte'
const API_TRABAJADOR_DIA_URL = '/api/trabajador-dia'

class DiaTrabajoService {
  // ==================== DÍAS ====================

  /**
   * Agregar un día a un reporte
   */
  agregarDia(reporteId: string, data: DiaTrabajoRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${API_BASE_URL}/${reporteId}/dias`, data)
  }

  /**
   * Obtener todos los días de un reporte
   */
  obtenerDiasPorReporte(reporteId: string): Promise<AxiosResponse<DiaTrabajoListResponse>> {
    return axios.get(`${API_BASE_URL}/${reporteId}/dias`)
  }

  /**
   * Eliminar un día
   */
  eliminarDia(diaId: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/dias/${diaId}`)
  }

  // ==================== TRABAJADORES POR DÍA ====================

  /**
   * Agregar un trabajador a un día
   */
  agregarTrabajadorADia(diaTrabajoId: string, data: { trabajadorId: string, horas: string, norma: string }): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${API_TRABAJADOR_DIA_URL}/${diaTrabajoId}/trabajadores`, data)
  }

  /**
   * Actualizar horas/norma de un trabajador en un día
   */
  actualizarTrabajadorDia(id: string, data: { horas: string, norma: string }): Promise<AxiosResponse<{ id: string }>> {
    return axios.put(`${API_TRABAJADOR_DIA_URL}/${id}`, data)
  }

  /**
   * Eliminar un trabajador de un día
   */
  eliminarTrabajadorDia(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_TRABAJADOR_DIA_URL}/${id}`)
  }

  /**
   * Obtener todos los trabajadores de un día
   */
  obtenerTrabajadoresPorDia(diaTrabajoId: string): Promise<AxiosResponse<TrabajadorDiaListResponse>> {
    return axios.get(`${API_TRABAJADOR_DIA_URL}/dia/${diaTrabajoId}`)
  }
}

export default new DiaTrabajoService()