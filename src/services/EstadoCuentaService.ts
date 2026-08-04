import axios, { AxiosResponse } from 'axios';
import type { EstadoCuenta, SearchFilter, PagedResponse } from '@/types/EstadoCuenta';

const API_BASE_URL = '/api/estado-cuenta';

interface SearchParams {
  filter?: SearchFilter[];
  query?: string;
  size?: number;
  page?: number;
  sortBy?: string;
  sortType?: 'ASC' | 'DESC';
}

export interface PreviewXmlResponse {
  operaciones: EstadoCuenta[];
  totalOperaciones: number;
  saldoCreditoTotal: number;
  saldoDebitoTotal: number;
}

export interface EstadoCuentaBatchItem {
  fecha: string;
  refOrigen: string;
  refCorriente: string;
  observaciones: string;
  type: string;
  importe: number;
  clienteId: string | null;
}

export interface BatchResponse {
  createdIds: string[];
  totalCreated: number;
  command: string;
}

class EstadoCuentaService {
  crearEstadoCuenta(estadoCuenta: EstadoCuenta): Promise<AxiosResponse<EstadoCuenta>> {
    return axios.post(API_BASE_URL, estadoCuenta);
  }

  obtenerEstadoCuentaPorId(id: string): Promise<AxiosResponse<EstadoCuenta>> {
    return axios.get(`${API_BASE_URL}/${id}`);
  }

  buscarEstadoCuenta(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<EstadoCuenta>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || '',
      sortType: filtros.sortType || 'ASC'
    };

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async uploadXml(xmlString: string): Promise<{ id: string }> {
    const response = await axios.post<{ id: string }>(`${API_BASE_URL}/upload-xml`, xmlString, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  }

  async previewXml(xmlString: string): Promise<AxiosResponse<PreviewXmlResponse>> {
    return axios.post(`${API_BASE_URL}/preview-xml`, xmlString, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

  async crearBatch(operaciones: EstadoCuentaBatchItem[]): Promise<AxiosResponse<BatchResponse>> {
    return axios.post(`${API_BASE_URL}/batch`, { operaciones }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Llama al endpoint /export para descargar el archivo Excel.
   * @param params URLSearchParams con fechaInicio y fechaFin.
   * @returns Promesa con la respuesta de Axios (que contiene el Blob binario).
   */
  async exportar(params: URLSearchParams): Promise<AxiosResponse<Blob>> {
    return axios.get(`${API_BASE_URL}/export`, {
      params: params,
      // ** CLAVE: Solicitar una respuesta binaria para descargar el archivo **
      responseType: 'blob', 
      headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  }

}

export default new EstadoCuentaService();