// src/services/ProductoService.ts

import axios, { AxiosResponse } from 'axios'
import type { Producto, ProductoRequest } from '@/types/Producto'
import type { PagedResponse, SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/producto'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

interface ImportExcelResponse {
  totalImportados: number
  totalErrores: number
  productosCreados: string[]
  errores: string[]
}

class ProductoService {
  crearProducto(producto: ProductoRequest): Promise<AxiosResponse<Producto>> {
    return axios.post(API_BASE_URL, producto)
  }

  obtenerProductoPorId(id: string): Promise<AxiosResponse<Producto>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  actualizarProducto(id: string, producto: ProductoRequest): Promise<AxiosResponse<Producto>> {
    return axios.put(`${API_BASE_URL}/${id}`, producto)
  }

  eliminarProducto(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  buscarProductos(filtros: SearchParams): Promise<AxiosResponse<PagedResponse<Producto>>> {
    const requestBody = {
      filter: filtros.filter || [],
      query: filtros.query || '',
      pageSize: filtros.size || 10,
      page: filtros.page || 0,
      sortBy: filtros.sortBy || 'createdAt',
      sortType: filtros.sortType || 'DES'
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  importarExcel(file: File): Promise<AxiosResponse<ImportExcelResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    return axios.post(`${API_BASE_URL}/import-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  exportarProductos(ids: string[]): Promise<AxiosResponse<Blob>> {
    return axios.post(`${API_BASE_URL}/export`, ids, {
      responseType: 'blob'
    })
  }

  // Métodos adicionales útiles
  obtenerProductosActivos(): Promise<AxiosResponse<Producto[]>> {
    return axios.get(`${API_BASE_URL}/active`)
  }

  // ✅ CORREGIDO: removida la anotación de tipo explícita
  obtenerProductosStockBajo(threshold = 5): Promise<AxiosResponse<Producto[]>> {
    return axios.get(`${API_BASE_URL}/low-stock`, {
      params: { threshold }
    })
  }

  obtenerProductoPorCodigo(code: string): Promise<AxiosResponse<Producto>> {
    return axios.get(`${API_BASE_URL}/code/${code}`)
  }

  actualizarStock(id: string, cantidad: number): Promise<AxiosResponse<Producto>> {
    return axios.patch(`${API_BASE_URL}/${id}/stock`, { quantity: cantidad })
  }
}

export default new ProductoService()