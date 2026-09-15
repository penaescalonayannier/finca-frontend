import axios, { AxiosResponse } from 'axios'
import type { ConfiguracionEmpresa } from '@/types/ConfiguracionEmpresa'

const API_BASE_URL = '/api/configuracion-empresa'

class ConfiguracionEmpresaService {
  getActive(): Promise<AxiosResponse<ConfiguracionEmpresa>> {
    return axios.get(API_BASE_URL)
  }

  findById(id: string): Promise<AxiosResponse<ConfiguracionEmpresa>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  create(config: ConfiguracionEmpresa): Promise<AxiosResponse<ConfiguracionEmpresa>> {
    return axios.post(API_BASE_URL, config)
  }

  update(id: string, config: ConfiguracionEmpresa): Promise<AxiosResponse<ConfiguracionEmpresa>> {
    return axios.put(`${API_BASE_URL}/${id}`, config)
  }

  delete(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }
}

export default new ConfiguracionEmpresaService()
