import axios from 'axios'
import type { Grupo, CreateGrupoRequest, UpdateGrupoRequest, GrupoListResponse } from '@/types/Grupo'

const API_BASE_URL = '/api/grupo'

const GrupoService = {
  // Create
  create(data: CreateGrupoRequest) {
    return axios.post<{ id: string }>(API_BASE_URL, data)
  },

  // Read
  getById(id: string) {
    return axios.get<Grupo>(`${API_BASE_URL}/${id}`)
  },

  // Update
  update(id: string, data: UpdateGrupoRequest) {
    return axios.put<Grupo>(`${API_BASE_URL}/${id}`, data)
  },

  // Delete
  delete(id: string) {
    return axios.delete(`${API_BASE_URL}/${id}`)
  },

  // Search with pagination
  search(page = 0, size = 10, sortBy = 'nombre', sortType: 'ASC' | 'DES' = 'ASC') {
    return axios.post<GrupoListResponse>(`${API_BASE_URL}/search`, {
      pageSize: size,
      page: page,
      sortBy: sortBy,
      sortType: sortType,
      filter: []
    })
  },

  // Get all grupos (simple list without pagination)
  getAll() {
    return axios.post<GrupoListResponse>(`${API_BASE_URL}/search`, {
      pageSize: 1000,
      page: 0,
      sortBy: 'nombre',
      sortType: 'ASC',
      filter: []
    })
  },

  // Assign worker to group
  asignarTrabajador(grupoId: string, trabajadorId: string) {
    return axios.post(`${API_BASE_URL}/${grupoId}/asignar-trabajador`, {
      trabajadorId
    })
  }
}

export default GrupoService
