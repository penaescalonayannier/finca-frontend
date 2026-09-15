import axios from 'axios';
import type { Auditoria, AuditoriaSearchRequest, TipoAccion } from '@/types/Auditoria';
import type { PagedResponse } from '@/types/EstadoCuenta';

const API_BASE_URL = '/api/auditoria';

export type AuditoriaPagedResponse = PagedResponse<Auditoria>;

export const AuditoriaService = {
  async search(request: AuditoriaSearchRequest): Promise<AuditoriaPagedResponse> {
    const response = await axios.post<AuditoriaPagedResponse>(`${API_BASE_URL}/search`, request);
    return response.data;
  },

  async getById(id: string): Promise<Auditoria> {
    const response = await axios.get<Auditoria>(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  async getHistorialEntidad(entidad: string, entidadId: string): Promise<Auditoria[]> {
    const response = await axios.get<Auditoria[]>(`${API_BASE_URL}/entidad/${entidad}/${entidadId}`);
    return response.data;
  },

  async getEntidades(): Promise<string[]> {
    const response = await axios.get<string[]>(`${API_BASE_URL}/entidades`);
    return response.data;
  },

  async getAcciones(): Promise<TipoAccion[]> {
    const response = await axios.get<TipoAccion[]>(`${API_BASE_URL}/acciones`);
    return response.data;
  }
};
