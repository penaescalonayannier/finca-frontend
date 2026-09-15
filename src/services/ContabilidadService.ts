// src/services/ContabilidadService.ts

import axios from 'axios'
import type {
  CuentaContable,
  CuentaContableRequest,
  AsientoContable,
  AsientoContableResponse,
  ReglaContabilizacion,
  TotalesPeriodo,
  MayorPorCuenta,
  BalanceComprobacion,
  TipoCuenta
} from '@/types/Contabilidad'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9908'

// ==================== CUENTAS CONTABLES ====================

export const CuentaContableService = {
  // ==================== CRUD ====================

  async create(data: CuentaContableRequest): Promise<string> {
    const response = await axios.post(`${API_URL}/api/cuenta-contable`, data)
    return response.data
  },

  async update(id: string, data: CuentaContableRequest): Promise<void> {
    await axios.put(`${API_URL}/api/cuenta-contable/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/cuenta-contable/${id}`)
  },

  async activar(id: string): Promise<void> {
    await axios.put(`${API_URL}/api/cuenta-contable/${id}/activar`)
  },

  async desactivar(id: string): Promise<void> {
    await axios.put(`${API_URL}/api/cuenta-contable/${id}/desactivar`)
  },

  // ==================== CONSULTAS ====================

  async getAll(): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable`)
    return response.data
  },

  async getById(id: string): Promise<CuentaContable> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/${id}`)
    return response.data
  },

  async getByCodigo(codigo: string): Promise<CuentaContable> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/codigo/${codigo}`)
    return response.data
  },

  async getByTipo(tipo: TipoCuenta): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/tipo/${tipo}`)
    return response.data
  },

  async getGruposPrincipales(): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/grupos-principales`)
    return response.data
  },

  async getCuentasMovibles(): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/movibles`)
    return response.data
  },

  async getCentrosCosto(): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/centros-costo`)
    return response.data
  },

  async getSubcuentas(cuentaPadreId: string): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/subcuentas/${cuentaPadreId}`)
    return response.data
  },

  async search(query: string): Promise<CuentaContable[]> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/search`, {
      params: { query }
    })
    return response.data
  },

  async count(): Promise<number> {
    const response = await axios.get(`${API_URL}/api/cuenta-contable/count`)
    return response.data
  }
}

// ==================== ASIENTOS CONTABLES ====================

export const AsientoContableService = {
  async getAll(
    page = 0,
    size = 20,
    sortBy = 'fecha',
    sortDir = 'DESC'
  ): Promise<AsientoContableResponse> {
    const response = await axios.get(`${API_URL}/api/asiento-contable`, {
      params: { page, size, sortBy, sortDir }
    })
    return response.data
  },

  async getById(id: string): Promise<AsientoContable> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/${id}`)
    return response.data
  },

  async getByNumero(numero: string): Promise<AsientoContable> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/numero/${numero}`)
    return response.data
  },

  async getByMovimientoStockId(movimientoStockId: string): Promise<AsientoContable> {
    const response = await axios.get(
      `${API_URL}/api/asiento-contable/movimiento/${movimientoStockId}`
    )
    return response.data
  },

  async getByAlmacenId(
    almacenId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<AsientoContable[]> {
    const params: Record<string, string> = {}
    if (fechaInicio) params.fechaInicio = fechaInicio
    if (fechaFin) params.fechaFin = fechaFin
    const response = await axios.get(`${API_URL}/api/asiento-contable/almacen/${almacenId}`, {
      params
    })
    return response.data
  },

  async getByFecha(fechaInicio: string, fechaFin: string): Promise<AsientoContable[]> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/fecha`, {
      params: { fechaInicio, fechaFin }
    })
    return response.data
  },

  async getDescuadrados(): Promise<AsientoContable[]> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/descuadrados`)
    return response.data
  },

  async getTotalesPorPeriodo(fechaInicio: string, fechaFin: string): Promise<TotalesPeriodo> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/totales`, {
      params: { fechaInicio, fechaFin }
    })
    return response.data
  },

  async getMayorPorCuenta(
    codigoCuenta: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<MayorPorCuenta> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/mayor/${codigoCuenta}`, {
      params: { fechaInicio, fechaFin }
    })
    return response.data
  },

  async getBalanceComprobacion(
    fechaInicio: string,
    fechaFin: string
  ): Promise<BalanceComprobacion> {
    const response = await axios.get(`${API_URL}/api/asiento-contable/balance-comprobacion`, {
      params: { fechaInicio, fechaFin }
    })
    return response.data
  }
}

// ==================== REGLAS DE CONTABILIZACIÓN ====================

export const ReglaContabilizacionService = {
  async getAll(): Promise<ReglaContabilizacion[]> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion`)
    return response.data
  },

  async getById(id: string): Promise<ReglaContabilizacion> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion/${id}`)
    return response.data
  },

  async getByTipoMovimiento(tipoMovimiento: string): Promise<ReglaContabilizacion[]> {
    const response = await axios.get(
      `${API_URL}/api/regla-contabilizacion/tipo/${tipoMovimiento}`
    )
    return response.data
  },

  async getTiposMovimientoConRegla(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion/tipos-movimiento`)
    return response.data
  },

  async getAllTiposMovimiento(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion/all-tipos-movimiento`)
    return response.data
  },

  async create(regla: ReglaContabilizacion): Promise<ReglaContabilizacion> {
    const response = await axios.post(`${API_URL}/api/regla-contabilizacion`, regla)
    return response.data
  },

  async activar(id: string): Promise<void> {
    await axios.put(`${API_URL}/api/regla-contabilizacion/${id}/activar`)
  },

  async desactivar(id: string): Promise<void> {
    await axios.put(`${API_URL}/api/regla-contabilizacion/${id}/desactivar`)
  },

  async getByFincaId(fincaId: string): Promise<ReglaContabilizacion[]> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion/finca/${fincaId}`)
    return response.data
  },

  async getByAlmacenId(almacenId: string): Promise<ReglaContabilizacion[]> {
    const response = await axios.get(`${API_URL}/api/regla-contabilizacion/almacen/${almacenId}`)
    return response.data
  }
}

export default {
  CuentaContable: CuentaContableService,
  AsientoContable: AsientoContableService,
  ReglaContabilizacion: ReglaContabilizacionService
}
