import axios from 'axios'
import type { CargoEntity, CreateCargoRequest, UpdateCargoRequest, CargoListResponse } from '@/types/Cargo'

const api = axios.create({
  baseURL: '/api'
})

const CargoService = {
  // Create
  create(data: CreateCargoRequest) {
    return api.post<CargoEntity>('/cargo', data)
  },

  // Read
  getById(id: string) {
    return api.get<CargoEntity>(`/cargo/${id}`)
  },

  // Update
  update(id: string, data: UpdateCargoRequest) {
    return api.put<CargoEntity>(`/cargo/${id}`, data)
  },

  // Delete
  delete(id: string) {
    return api.delete(`/cargo/${id}`)
  },

  // Search with pagination
  search(page = 0, size = 10, sortBy = 'name', sortType: 'ASC' | 'DESC' = 'ASC') {
    return api.post<CargoListResponse>('/cargo/search', {
      pageSize: size,
      page: page,
      sortBy: sortBy,
      sortType: sortType,
      filter: []
    })
  },

  // Get all cargos (simple list without pagination)
  getAll() {
    return api.post<CargoListResponse>('/cargo/search', {
      pageSize: 1000,
      page: 0,
      sortBy: 'name',
      sortType: 'ASC',
      filter: []
    })
  }
}

export default CargoService
