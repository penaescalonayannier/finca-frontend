// src/services/ClienteService.ts

import axios, { AxiosResponse } from 'axios';
// Asumo que tiene un tipo Cliente en /types/Cliente
import type { Cliente } from '@/types/Cliente'; 
import type { ClienteRequest } from '@/types/Cliente'; // Para la creación

// Importar los tipos necesarios para la búsqueda paginada
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'; // Reutilizar PagedResponse y SearchFilter de EstadoCuenta

const API_BASE_URL = '/api/cliente';

// Definir los parámetros de búsqueda (similares a SearchParams de EstadoCuentaService)
interface SearchParams {
  filter?: SearchFilter[];
  query?: string;
  size?: number;
  page?: number;
  sortBy?: string;
  sortType?: 'ASC' | 'DESC';
}

class ClienteService {
  /**
   * Envía una solicitud POST para crear un nuevo Cliente.
   * Corresponde al endpoint POST /api/cliente.
   * @param clienteRequest Datos del cliente a crear (cuenta, nombre, ruc, direccion).
   * @returns Promesa con la respuesta del mensaje del comando.
   */
  crearCliente(clienteRequest: ClienteRequest): Promise<AxiosResponse<any>> {
    // El request body es CreateClienteRequest
    return axios.post(API_BASE_URL, clienteRequest);
  }

  /**
   * Obtiene un cliente por su ID.
   * Corresponde al endpoint GET /api/cliente/{id}.
   * @param id ID del cliente a obtener.
   * @returns Promesa con los datos del cliente.
   */
  obtenerClientePorId(id: string): Promise<AxiosResponse<Cliente>> {
    return axios.get(`${API_BASE_URL}/${id}`);
  }

  /**
   * Implementación de la búsqueda paginada de Clientes.
   * Corresponde al endpoint POST /api/cliente/search.
   * @param filtros Objeto con parámetros de paginación y filtros.
   * @returns Promesa con la respuesta paginada de Clientes.
   */
  buscarClientes(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Cliente>>> {
      const requestBody = {
        filter: filtros.filter || [],
        query: filtros.query || '',
        pageSize: filtros.size || 10,
        page: filtros.page || 0,
        sortBy: filtros.sortBy || '',
        sortType: filtros.sortType || 'ASC'
      };

      // Llamada POST al nuevo endpoint /search
      return axios.post(`${API_BASE_URL}/search`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  }
}

export default new ClienteService();