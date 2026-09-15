// src/services/SalidaService.ts

import axios, { AxiosResponse } from 'axios'
import type {
  Salida,
  CreateSalidaRequest,
  UpdateSalidaRequest,
  SalidaResponse
} from '@/types/Salida'
import type { SearchFilter } from '@/types/EstadoCuenta'

const API_BASE_URL = '/api/salida'

interface SearchParams {
  filter?: SearchFilter[]
  query?: string
  size?: number
  page?: number
  sortBy?: string
  sortType?: 'ASC' | 'DES'
}

class SalidaService {
  // Crear nueva salida
  create(data: CreateSalidaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(API_BASE_URL, data)
  }

  // Actualizar salida
  update(id: string, data: UpdateSalidaRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.put(`${API_BASE_URL}/${id}`, data)
  }

  // Eliminar salida
  delete(id: string): Promise<AxiosResponse<void>> {
    return axios.delete(`${API_BASE_URL}/${id}`)
  }

  // Obtener por ID
  findById(id: string): Promise<AxiosResponse<Salida>> {
    return axios.get(`${API_BASE_URL}/${id}`)
  }

  // Busqueda paginada
  search(params: SearchParams): Promise<AxiosResponse<SalidaResponse>> {
    const sortType = params.sortType === 'ASC' ? 'ASC' : 'DES'
    const requestBody = {
      filter: params.filter || [],
      query: params.query || '',
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: params.sortBy || 'fecha',
      sortType: sortType
    }

    return axios.post(`${API_BASE_URL}/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Descargar factura PDF
  async descargarFactura(id: string): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/${id}/factura`, {
      responseType: 'blob'
    })

    const contentDisposition = response.headers['content-disposition']
    let filename = 'factura.pdf'
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async descargarValesConsolidados(fecha: string, destino: string): Promise<void> {
    const response = await axios.get(`${API_BASE_URL}/vales/consolidado`, {
      params: { fecha, destino },
      responseType: 'blob'
    })

    const disposition = response.headers['content-disposition']
    const filename = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '')
      || `Vale_consolidado_${destino}_${fecha}.pdf`
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  obtenerValesPorFecha(fecha: string): Promise<AxiosResponse<Salida[]>> {
    return axios.get(`${API_BASE_URL}/vales`, { params: { fecha } })
  }

  async descargarValesConsolidadosPorDestino(fecha: string, salidaIds: string[]): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/vales/consolidado`, { fecha, salidaIds }, {
      responseType: 'blob'
    })
    const disposition = response.headers['content-disposition']
    const filename = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '')
      || `Vales_consolidados_${fecha}.pdf`
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async descargarValesIndividuales(fecha: string, salidaIds: string[]): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/vales/individuales/pdf`, { fecha, salidaIds }, {
      responseType: 'blob'
    })
    const disposition = response.headers['content-disposition']
    const filename = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '')
      || `Vales_individuales_${fecha}.pdf`
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export default new SalidaService()
