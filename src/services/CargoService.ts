import axios from 'axios'
import type { CargoEntity, CreateCargoRequest, UpdateCargoRequest, CargoListResponse } from '@/types/Cargo'

const API_BASE_URL = '/api/cargo'

const CargoService = {
  // Create
  create(data: CreateCargoRequest) {
    return axios.post<CargoEntity>(API_BASE_URL, data)
  },

  // Read
  getById(id: string) {
    return axios.get<CargoEntity>(`${API_BASE_URL}/${id}`)
  },

  // Update
  update(id: string, data: UpdateCargoRequest) {
    return axios.put<CargoEntity>(`${API_BASE_URL}/${id}`, data)
  },

  // Delete
  delete(id: string) {
    return axios.delete(`${API_BASE_URL}/${id}`)
  },

  // Search with pagination
  search(page = 0, size = 10, sortBy = 'name', sortType: 'ASC' | 'DES' = 'ASC') {
    return axios.post<CargoListResponse>(`${API_BASE_URL}/search`, {
      pageSize: size,
      page: page,
      sortBy: sortBy,
      sortType: sortType,
      filter: []
    })
  },

  // Get all cargos (simple list without pagination)
  getAll() {
    return axios.post<CargoListResponse>(`${API_BASE_URL}/search`, {
      pageSize: 1000,
      page: 0,
      sortBy: 'name',
      sortType: 'ASC',
      filter: []
    })
  }
}

export default CargoService
