import axios from 'axios'
import type { Grupo, CreateGrupoRequest, UpdateGrupoRequest, GrupoListResponse } from '@/types/Grupo'

const api = axios.create({
  baseURL: '/api'
})

const GrupoService = {
  // Create
  create(data: CreateGrupoRequest) {
    return api.post<{ id: string }>('/grupo', data)
  },

  // Read
  getById(id: string) {
    return api.get<Grupo>(`/grupo/${id}`)
  },

  // Update
  update(id: string, data: UpdateGrupoRequest) {
    return api.put<Grupo>(`/grupo/${id}`, data)
  },

  // Delete
  delete(id: string) {
    return api.delete(`/grupo/${id}`)
  },

  // Search with pagination
  search(page = 0, size = 10, sortBy = 'nombre', sortType: 'ASC' | 'DES' = 'ASC') {
    return api.post<GrupoListResponse>('/grupo/search', {
      pageSize: size,
      page: page,
      sortBy: sortBy,
      sortType: sortType,
      filter: []
    })
  },

  // Get all grupos (simple list without pagination)
  getAll() {
    return api.post<GrupoListResponse>('/grupo/search', {
      pageSize: 1000,
      page: 0,
      sortBy: 'nombre',
      sortType: 'ASC',
      filter: []
    })
  },

  // Assign worker to group
  asignarTrabajador(grupoId: string, trabajadorId: string) {
    return api.post(`/grupo/${grupoId}/asignar-trabajador`, {
      trabajadorId
    })
  }
}

export default GrupoService
