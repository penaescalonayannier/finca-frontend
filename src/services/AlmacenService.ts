// src/services/AlmacenService.ts

import axios, { AxiosResponse } from 'axios'
import type {
  Almacen,
  AlmacenRequest,
  AlmacenProductoRequest,
  AlmacenFincaProducto,
  EntradaAlmacenRequest,
  EntradaProduccionAlmacenRequest,
  EntradaProduccionAlmacenResponse,
  SalidaMultipleAlmacenRequest,
  SalidaMultipleAlmacenResponse,
  TransferenciaAlmacenRequest,
  TransferenciaAlmacenDetalle,
  RecepcionTransferenciaAlmacenRequest,
  AsignarProductoStockRequest,
  StockOperationResponse
} from '@/types/Almacen'
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

  // ==================== STOCK POR ALMACÉN ====================

  /**
   * Obtener stock de todos los productos de un almacen
   */
  obtenerStockAlmacen(almacenId: string): Promise<AxiosResponse<AlmacenFincaProducto[]>> {
    return axios.get(`${API_BASE_URL}/${almacenId}/stock`)
  }

  /** Obtener los almacenes que contienen un producto de finca */
  obtenerAlmacenesPorFincaProducto(fincaProductoId: string): Promise<AxiosResponse<AlmacenFincaProducto[]>> {
    return axios.get(`${API_BASE_URL}/finca-producto/${fincaProductoId}/almacenes`)
  }

  /** Almacenes activos de una finca, para documentos de control físico. */
  obtenerAlmacenesPorFinca(fincaId: string): Promise<AxiosResponse<any>> {
    return axios.get(`${API_BASE_URL}/por-finca/${fincaId}`, { params: { page: 0, pageSize: 200 } })
  }

  /**
   * Obtener stock total del almacen
   */
  obtenerStockTotalAlmacen(almacenId: string): Promise<AxiosResponse<number>> {
    return axios.get(`${API_BASE_URL}/${almacenId}/stock/total`)
  }

  // ==================== ENTRADAS ====================

  /**
   * Registrar entrada de stock en un almacen
   */
  entradaStock(almacenId: string, data: EntradaAlmacenRequest): Promise<AxiosResponse<StockOperationResponse>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/entrada`, data)
  }

  /** Descarga la representación de consulta del informe SC-2-04 ya emitido. */
  async descargarInformeRecepcionPdf(id: string): Promise<void> {
    const response = await axios.get(`/api/informes-recepcion/${id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `SC-2-04_${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Registra una producción terminada y su entrada al almacén de forma atómica.
   */
  entradaPorProduccion(almacenId: string, data: EntradaProduccionAlmacenRequest): Promise<AxiosResponse<EntradaProduccionAlmacenResponse>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/entrada-produccion-terminada`, data)
  }

  // ==================== SALIDAS DOCUMENTALES ====================
  /** Registra una salida documental del almacén en una operación atómica. */
  salidaMultiple(almacenId: string, data: SalidaMultipleAlmacenRequest): Promise<AxiosResponse<SalidaMultipleAlmacenResponse>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/salida-multiple`, data)
  }

  // ==================== TRANSFERENCIAS ====================

  /**
   * Transferir stock entre almacenes
   */
  transferirStock(almacenId: string, data: TransferenciaAlmacenRequest): Promise<AxiosResponse<StockOperationResponse>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/transferir`, data)
  }

  transferenciasPendientes(almacenId: string): Promise<AxiosResponse<TransferenciaAlmacenDetalle[]>> {
    return axios.get(`${API_BASE_URL}/${almacenId}/transferencias-pendientes`)
  }

  recibirTransferencia(almacenId: string, transferenciaId: string, data: RecepcionTransferenciaAlmacenRequest): Promise<AxiosResponse<TransferenciaAlmacenDetalle>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/transferencias/${transferenciaId}/recibir`, data)
  }

  revertirTransferencia(almacenId: string, transferenciaId: string, motivo: string): Promise<AxiosResponse<void>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/transferencias/${transferenciaId}/revertir`, { motivo })
  }

  /**
   * Obtener almacenes destino disponibles para transferencia
   */
  obtenerDestinosDisponibles(almacenId: string, fincaProductoId: string): Promise<AxiosResponse<AlmacenFincaProducto[]>> {
    return axios.get(`${API_BASE_URL}/${almacenId}/productos/${fincaProductoId}/destinos-disponibles`)
  }

  // ==================== ASIGNAR CON STOCK ====================

  /**
   * Asignar producto a almacen con stock inicial
   */
  asignarProductoConStock(almacenId: string, data: AsignarProductoStockRequest): Promise<AxiosResponse<{ id: string }>> {
    return axios.post(`${API_BASE_URL}/${almacenId}/asignar-producto`, data)
  }
}

export default new AlmacenService()
