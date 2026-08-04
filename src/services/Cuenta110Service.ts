// src/services/Cuenta110Service.ts

import axios, { AxiosResponse } from 'axios';

// Tipo de respuesta del backend (Debe coincidir con Cuenta110EfectivoBancoResponse.java)
export interface Cuenta110ImporteResponse {
  id: string;
  observaciones: string;
  importe: number;
}

const API_BASE_URL = '/api/cuenta110';

class Cuenta110Service {
  /**
   * Obtiene el único registro de la Cuenta 110 (Efectivo en Banco).
   */
  obtenerImporteUnico(): Promise<AxiosResponse<Cuenta110ImporteResponse>> {
    return axios.get(`${API_BASE_URL}/unique`);
  }
}

export default new Cuenta110Service();