import axios from 'axios'
import type { TipoAnimal, TipoAnimalRequest } from '@/types/TipoAnimal'

const API_URL = '/api/tipo-animal'

export default {
  async getAll(): Promise<TipoAnimal[]> {
    const response = await axios.get(`${API_URL}/all`)
    return response.data
  },

  async getById(id: string): Promise<TipoAnimal> {
    const response = await axios.get(`${API_URL}/${id}`)
    return response.data
  },

  async search(params: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortType?: 'ASC' | 'DESC'
    filter?: Array<{ key: string; operator: string; value: string }>
  }): Promise<{
    content: TipoAnimal[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }> {
    const response = await axios.post(`${API_URL}/search`, {
      page: params.page ?? 0,
      pageSize: params.pageSize ?? 10,
      sortBy: params.sortBy ?? 'orden',
      sortType: params.sortType ?? 'ASC',
      filter: params.filter ?? []
    })
    return response.data
  },

  async create(data: TipoAnimalRequest): Promise<string> {
    const response = await axios.post(API_URL, data)
    return response.data
  },

  async update(id: string, data: TipoAnimalRequest): Promise<void> {
    await axios.put(`${API_URL}/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`)
  }
}
