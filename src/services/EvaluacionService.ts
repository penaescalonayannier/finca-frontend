import axios from 'axios'
import type { Evaluacion, CreateEvaluacionRequest, CreateBatchEvaluacionRequest, CriterioEvaluacion, EstadoEvaluacion } from '@/types/Evaluacion'

const API_BASE_URL = '/api/evaluacion'

export interface EvaluacionPorPeriodo {
  id: string
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  trabajadorCargo: string | null
  jefeId: string
  grupoId: string
  mes: string
  year: number
  calificacion: number
  comentarios: string
  fechaEvaluacion: string
  estado?: EstadoEvaluacion
  evidencia?: string
  criteriosAplicados?: string
  constanciaJefe?: string
  constanciaTrabajador?: string
  fechaEnvio?: string
  fechaCierre?: string
}

export interface ConsolidadoMensualItem {
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  trabajadorCargo: string | null
  calificacion: number
  comentarios: string
  grupoId: string | null
  grupoNombre: string
}

export interface ConsolidadoMensual {
  data: ConsolidadoMensualItem[]
  total: number
  mes: string
  year: number
  promedioGeneral: number
  superiores: number
  adecuados: number
  deficientes: number
}

export interface ConsolidadoTrimestralItem {
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  trabajadorCargo: string | null
  promedioCalificacion: number
  cantidadEvaluaciones: number
  calificacionesPorMes: Record<string, number>
  grupoId: string | null
  grupoNombre: string
}

export interface ConsolidadoTrimestral {
  data: ConsolidadoTrimestralItem[]
  total: number
  year: number
  mesInicio: string
  mesFin: string
  meses: string[]
  promedioGeneral: number
}

export interface TrabajadorParaEvaluar {
  id: string
  nombre: string
  ruc: string
  cargo: string | null
  grupoId: string | null
  grupoNombre: string | null
  fincaId: string | null
  fincaNombre: string | null
}

class EvaluacionService {
  // Obtener todas las evaluaciones
  getAll() {
    return axios.get<{ data: Evaluacion[] }>(API_BASE_URL)
  }

  // Obtener evaluaciones por grupo
  getByGrupo(grupoId: string) {
    return axios.get<{ data: Evaluacion[] }>(`${API_BASE_URL}/grupo/${grupoId}`)
  }

  // Obtener evaluación por ID
  getById(id: string) {
    return axios.get<Evaluacion>(`${API_BASE_URL}/${id}`)
  }

  // Crear evaluación
  create(data: CreateEvaluacionRequest | any) {
    return axios.post<{ id: string }>(API_BASE_URL, data)
  }

  // Crear evaluaciones en batch
  createBatch(data: CreateBatchEvaluacionRequest) {
    return axios.post<{ message: string }>(`${API_BASE_URL}/batch`, data)
  }

  // Actualizar evaluación
  update(id: string, data: CreateEvaluacionRequest) {
    return axios.put<Evaluacion>(`${API_BASE_URL}/${id}`, data)
  }

  // Eliminar evaluación
  delete(id: string) {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  cambiarEstado(id: string, data: {
    estado: EstadoEvaluacion
    constanciaJefe?: string
    constanciaTrabajador?: string
    observacionesCierre?: string
  }) {
    return axios.put(`${API_BASE_URL}/${id}/estado`, data)
  }

  getCriterios(incluirInactivos = false) {
    return axios.get<CriterioEvaluacion[]>(`${API_BASE_URL}/criterios`, { params: { incluirInactivos } })
  }

  guardarCriterio(criterio: CriterioEvaluacion) {
    return axios.post<CriterioEvaluacion>(`${API_BASE_URL}/criterios`, criterio)
  }

  desactivarCriterio(id: string) {
    return axios.delete(`${API_BASE_URL}/criterios/${id}`)
  }

  // Obtener evaluaciones por período (mes/año)
  getByPeriodo(mes: string, year: number) {
    return axios.get<{ data: EvaluacionPorPeriodo[]; total: number }>(`${API_BASE_URL}/por-periodo`, {
      params: { mes, year }
    })
  }

  // Obtener consolidado mensual
  getConsolidadoMensual(mes: string, year: number) {
    return axios.get<ConsolidadoMensual>(`${API_BASE_URL}/consolidado-mensual`, {
      params: { mes, year }
    })
  }

  // Obtener consolidado trimestral
  getConsolidadoTrimestral(year: number, mesInicio: string, mesFin: string) {
    return axios.get<ConsolidadoTrimestral>(`${API_BASE_URL}/consolidado-trimestral`, {
      params: { year, mesInicio, mesFin }
    })
  }

  // Obtener trabajadores para evaluar
  getTrabajadoresParaEvaluar() {
    return axios.get<{ data: TrabajadorParaEvaluar[]; total: number }>(`${API_BASE_URL}/trabajadores-para-evaluar`)
  }

  // Obtener años disponibles
  getAnosDisponibles() {
    return axios.get<number[]>(`${API_BASE_URL}/anos-disponibles`)
  }

  // Obtener meses disponibles para un año
  getMesesDisponibles(year: number) {
    return axios.get<string[]>(`${API_BASE_URL}/meses-disponibles`, {
      params: { year }
    })
  }
}

export default new EvaluacionService()
