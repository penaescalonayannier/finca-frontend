// src/services/DashboardService.ts
import axios from 'axios'

export interface DashboardMetrics {
  trabajadores: {
    total: number
    activos: number
  }
  productos: {
    total: number
    stockBajo: number
  }
  fincas: {
    total: number
  }
  deudas: {
    totalPendiente: number
    trabajadoresConDeuda: number
  }
  salidas: {
    hoy: number
    semana: number
  }
  produccion: {
    semana: number
  }
}

class DashboardService {
  private baseUrl = '/api'

  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // Hacer llamadas en paralelo para mejor rendimiento
      const [
        trabajadoresRes,
        productosRes,
        fincasRes,
        deudasRes
      ] = await Promise.all([
        this.getTrabajadoresMetrics(),
        this.getProductosMetrics(),
        this.getFincasMetrics(),
        this.getDeudasMetrics()
      ])

      return {
        trabajadores: trabajadoresRes,
        productos: productosRes,
        fincas: fincasRes,
        deudas: deudasRes,
        salidas: { hoy: 0, semana: 0 },
        produccion: { semana: 0 }
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      // Retornar valores por defecto en caso de error
      return {
        trabajadores: { total: 0, activos: 0 },
        productos: { total: 0, stockBajo: 0 },
        fincas: { total: 0 },
        deudas: { totalPendiente: 0, trabajadoresConDeuda: 0 },
        salidas: { hoy: 0, semana: 0 },
        produccion: { semana: 0 }
      }
    }
  }

  private async getTrabajadoresMetrics() {
    try {
      const response = await axios.post(`${this.baseUrl}/trabajadores/search`, {
        page: 0,
        pageSize: 1,
        filter: [],
        query: ''
      })
      const total = response.data.totalElements || 0
      return { total, activos: total }
    } catch {
      return { total: 0, activos: 0 }
    }
  }

  private async getProductosMetrics() {
    try {
      const response = await axios.post(`${this.baseUrl}/productos/search`, {
        page: 0,
        pageSize: 1,
        filter: [],
        query: ''
      })
      const total = response.data.totalElements || 0

      // Intentar obtener productos con stock bajo
      let stockBajo = 0
      try {
        const stockRes = await axios.post(`${this.baseUrl}/finca-productos/search`, {
          page: 0,
          pageSize: 100,
          filter: [],
          query: ''
        })
        const fincaProductos = stockRes.data.data || []
        stockBajo = fincaProductos.filter((fp: any) => fp.stock < 10).length
      } catch {
        stockBajo = 0
      }

      return { total, stockBajo }
    } catch {
      return { total: 0, stockBajo: 0 }
    }
  }

  private async getFincasMetrics() {
    try {
      const response = await axios.post(`${this.baseUrl}/fincas/search`, {
        page: 0,
        pageSize: 1,
        filter: [],
        query: ''
      })
      return { total: response.data.totalElements || 0 }
    } catch {
      return { total: 0 }
    }
  }

  private async getDeudasMetrics() {
    try {
      const response = await axios.post(`${this.baseUrl}/deudas-trabajadores/search`, {
        page: 0,
        pageSize: 100,
        filter: [],
        query: ''
      })
      const deudas = response.data.data || []
      const conDeuda = deudas.filter((d: any) => d.deudaTotal > 0)
      const totalPendiente = conDeuda.reduce((sum: number, d: any) => sum + (d.deudaTotal || 0), 0)

      return {
        totalPendiente,
        trabajadoresConDeuda: conDeuda.length
      }
    } catch {
      return { totalPendiente: 0, trabajadoresConDeuda: 0 }
    }
  }
}

export default new DashboardService()
