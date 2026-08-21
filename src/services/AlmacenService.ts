// src/services/AlmacenService.ts

import axios, { AxiosResponse } from 'axios'
import type { Almacen, AlmacenRequest, AlmacenProductoRequest } from '@/types/Almacen'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/almacen'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class AlmacenService {
  // ==================== COMMANDS ====================

  /**
   * Crear un nuevo almacen
   */
  crearAlmacen(almacen: AlmacenRequest): Promise<AxiosResponse<Almacen>> {
    return axios.post(API_BASE_URL, almacen)
  }

  /**
   * Actualizar un almacen existente
   */
  actualizarAlmacen(id: string, almacen: AlmacenRequest): Promise<AxiosResponse<Almacen>> {
    return axios.put(`${API_BASE_URL}/${id}`, almacen)
  }

  /**
   * Eliminar un almacen por ID
   */
  eliminarAlmacen(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  /**
   * Agregar un producto (FincaProducto) al almacen
   */
  agregarProducto(data: AlmacenProductoRequest): Promise<AxiosResponse<Almacen>> {
    return axios.post(`${API_BASE_URL}/${data.almacenId}/productos`, {
      fincaProductoId: data.fincaProductoId
    })
  }

  /**
   * Remover un producto del almacen
   */
  removerProducto(almacenId: string, fincaProductoId: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${almacenId}/productos/${fincaProductoId}`)
  }

  // ==================== QUERIES ====================

  /**
   * Obtener un almacen por ID
   */
  obtenerAlmacenPorId(id: string): Promise<AxiosResponse<Almacen>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  /**
   * Busqueda paginada de almacenes con filtros
   */
  buscarAlmacenes(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Almacen>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || 'nombre',
      sortType: filtros.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Obtener productos de un almacen
   */
  obtenerProductosDeAlmacen(almacenId: string): Promise<AxiosResponse<Almacen>> {
    return axios.get(`${API_BASE_URL}/${almacenId}/productos`)
  }
}

export default new AlmacenService()
