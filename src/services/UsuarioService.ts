import axios, { AxiosResponse } from 'axios'
import type { Usuario, UsuarioRequest, TrabajadorDisponible } from '@/types/Usuario'

const API_BASE_URL = '/api/usuarios'

class UsuarioService {
  getAll(): Promise<AxiosResponse<Usuario[]>> {
    return axios.get(API_BASE_URL)
  }

  getById(id: string): Promise<AxiosResponse<Usuario>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  getByFinca(fincaId: string): Promise<AxiosResponse<Usuario[]>> {
    return axios.get(`${API_BASE_URL}/finca/${fincaId}`)
  }

  create(usuario: UsuarioRequest): Promise<AxiosResponse<Usuario>> {
    return axios.post(API_BASE_URL, usuario)
  }

  update(id: string, updates: Partial<Usuario>): Promise<AxiosResponse<Usuario>> {
    return axios.put(`${API_BASE_URL}/${id}`, updates)
  }

  changePassword(id: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> {
    return axios.patch(`${API_BASE_URL}/${id}/password`, { newPassword })
  }

  delete(id: string): Promise<AxiosResponse<{ message: string }>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  getTrabajadoresDisponibles(): Promise<AxiosResponse<TrabajadorDisponible[]>> {
    return axios.get(`${API_BASE_URL}/trabajadores-disponibles`)
  }
}

export default new UsuarioService()
