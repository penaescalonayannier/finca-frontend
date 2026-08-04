import axios from 'axios'
import type { Evaluacion, CreateEvaluacionRequest, CreateBatchEvaluacionRequest } from '@/types/Evaluacion'

const api = axios.create({
  baseURL: '/api'
})

class EvaluacionService {
  // Obtener todas las evaluaciones
  getAll() {
    return api.get<{ data: Evaluacion[] }>('/evaluacion')
  }

  // Obtener evaluaciones por grupo
  getByGrupo(grupoId: string) {
    return api.get<{ data: Evaluacion[] }>(`/evaluacion/grupo/${grupoId}`)
  }

  // Obtener evaluación por ID
  getById(id: string) {
    return api.get<Evaluacion>(`/evaluacion/${id}`)
  }

  // Crear evaluación
  create(data: CreateEvaluacionRequest) {
    return api.post<{ id: string }>('/evaluacion', data)
  }

  // Crear evaluaciones en batch
  createBatch(data: CreateBatchEvaluacionRequest) {
    return api.post<{ message: string }>('/evaluacion/batch', data)
  }

  // Actualizar evaluación
  update(id: string, data: CreateEvaluacionRequest) {
    return api.put<Evaluacion>(`/evaluacion/${id}`, data)
  }

  // Eliminar evaluación
  delete(id: string) {
    return api.delete(`/evaluacion/${id}`)
  }
}

export default new EvaluacionService()
