// src/services/ActivoFijoService.ts
// Servicios para el módulo de Activos Fijos Tangibles
// Referencia: NCC No. 7 (Resolución 1038/2017 MFP)

import axios from 'axios'
import type {
  GrupoActivoFijo,
  ActivoFijoTangible,
  ActivoAnimal,
  PlantacionPermanente,
  MovimientoDepreciacion,
  ResumenAnimal,
  ResumenPlantacion,
  ReporteDepreciacion,
  CreateActivoFijoRequest,
  CreateActivoAnimalRequest,
  CreatePlantacionRequest,
  PaginatedResponse,
  CategoriaAnimal,
  TipoGanado,
  TipoPlantacion
} from '@/types/ActivoFijo'

// ==================== GRUPO ACTIVO FIJO ====================
const GrupoActivoFijoService = {
  getAll() {
    return axios.get<GrupoActivoFijo[]>('/api/grupo-activo-fijo')
  },

  getAllActivos() {
    return axios.get<GrupoActivoFijo[]>('/api/grupo-activo-fijo/activos')
  },

  getById(id: string) {
    return axios.get<GrupoActivoFijo>(`/api/grupo-activo-fijo/${id}`)
  },

  getByCodigo(codigo: string) {
    return axios.get<GrupoActivoFijo>(`/api/grupo-activo-fijo/codigo/${codigo}`)
  },

  create(data: Partial<GrupoActivoFijo>) {
    return axios.post<GrupoActivoFijo>('/api/grupo-activo-fijo', data)
  },

  update(id: string, data: Partial<GrupoActivoFijo>) {
    return axios.put<GrupoActivoFijo>(`/api/grupo-activo-fijo/${id}`, data)
  },

  delete(id: string) {
    return axios.delete(`/api/grupo-activo-fijo/${id}`)
  }
}

// ==================== ACTIVO FIJO TANGIBLE ====================
const ActivoFijoService = {
  getById(id: string) {
    return axios.get<ActivoFijoTangible>(`/api/activo-fijo/${id}`)
  },

  getByNumeroInventario(numeroInventario: string) {
    return axios.get<ActivoFijoTangible>(`/api/activo-fijo/inventario/${numeroInventario}`)
  },

  create(data: CreateActivoFijoRequest) {
    return axios.post<ActivoFijoTangible>('/api/activo-fijo', data)
  },

  update(id: string, data: Partial<ActivoFijoTangible>) {
    return axios.put<ActivoFijoTangible>(`/api/activo-fijo/${id}`, data)
  },

  delete(id: string) {
    return axios.delete(`/api/activo-fijo/${id}`)
  },

  search(params: {
    query?: string
    grupoId?: string
    fincaId?: string
    activo?: boolean
    page?: number
    size?: number
    sortBy?: string
    sortType?: 'ASC' | 'DESC'
  }) {
    const filters = []
    if (params.grupoId) filters.push({ property: 'grupoId', operator: 'equals', value: params.grupoId })
    if (params.fincaId) filters.push({ property: 'fincaId', operator: 'equals', value: params.fincaId })
    if (params.activo !== undefined) filters.push({ property: 'activo', operator: 'equals', value: String(params.activo) })

    return axios.post<PaginatedResponse<ActivoFijoTangible>>('/api/activo-fijo/search', {
      query: params.query || '',
      filter: filters,
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: params.sortBy || 'numeroInventario',
      sortType: params.sortType || 'ASC'
    })
  },

  getByGrupo(grupoId: string) {
    return axios.get<ActivoFijoTangible[]>(`/api/activo-fijo/grupo/${grupoId}`)
  },

  getByFinca(fincaId: string) {
    return axios.get<ActivoFijoTangible[]>(`/api/activo-fijo/finca/${fincaId}`)
  },

  darDeBaja(id: string, motivo: string) {
    return axios.post<ActivoFijoTangible>(`/api/activo-fijo/${id}/baja`, { motivo })
  }
}

// ==================== ACTIVO ANIMAL ====================
const ActivoAnimalService = {
  getById(id: string) {
    return axios.get<ActivoAnimal>(`/api/activo-animal/${id}`)
  },

  create(data: CreateActivoAnimalRequest) {
    return axios.post<ActivoAnimal>('/api/activo-animal', data)
  },

  update(id: string, data: Partial<ActivoAnimal>) {
    return axios.put<ActivoAnimal>(`/api/activo-animal/${id}`, data)
  },

  delete(id: string) {
    return axios.delete(`/api/activo-animal/${id}`)
  },

  search(params: {
    query?: string
    tipoGanado?: TipoGanado
    categoria?: CategoriaAnimal
    fincaId?: string
    page?: number
    size?: number
  }) {
    const filters = []
    if (params.tipoGanado) filters.push({ property: 'tipoGanado', operator: 'equals', value: params.tipoGanado })
    if (params.categoria) filters.push({ property: 'categoria', operator: 'equals', value: params.categoria })
    if (params.fincaId) filters.push({ property: 'fincaId', operator: 'equals', value: params.fincaId })

    return axios.post<PaginatedResponse<ActivoAnimal>>('/api/activo-animal/search', {
      query: params.query || '',
      filter: filters,
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: 'categoria',
      sortType: 'ASC'
    })
  },

  getByTipoGanado(tipoGanado: TipoGanado) {
    return axios.get<ActivoAnimal[]>(`/api/activo-animal/tipo/${tipoGanado}`)
  },

  getByCategoria(categoria: CategoriaAnimal) {
    return axios.get<ActivoAnimal[]>(`/api/activo-animal/categoria/${categoria}`)
  },

  getByFinca(fincaId: string) {
    return axios.get<ActivoAnimal[]>(`/api/activo-animal/finca/${fincaId}`)
  },

  getResumenPorCategoria(fincaId: string) {
    return axios.get<ResumenAnimal[]>(`/api/activo-animal/finca/${fincaId}/resumen`)
  },

  getCategorias() {
    return axios.get<CategoriaAnimal[]>('/api/activo-animal/categorias')
  },

  getTiposGanado() {
    return axios.get<TipoGanado[]>('/api/activo-animal/tipos-ganado')
  }
}

// ==================== PLANTACION PERMANENTE ====================
const PlantacionService = {
  getById(id: string) {
    return axios.get<PlantacionPermanente>(`/api/plantacion-permanente/${id}`)
  },

  create(data: CreatePlantacionRequest) {
    return axios.post<PlantacionPermanente>('/api/plantacion-permanente', data)
  },

  update(id: string, data: Partial<PlantacionPermanente>) {
    return axios.put<PlantacionPermanente>(`/api/plantacion-permanente/${id}`, data)
  },

  delete(id: string) {
    return axios.delete(`/api/plantacion-permanente/${id}`)
  },

  search(params: {
    query?: string
    tipoPlantacion?: TipoPlantacion
    bloque?: number
    fincaId?: string
    page?: number
    size?: number
  }) {
    const filters = []
    if (params.tipoPlantacion) filters.push({ property: 'tipoPlantacion', operator: 'equals', value: params.tipoPlantacion })
    if (params.bloque) filters.push({ property: 'bloque', operator: 'equals', value: String(params.bloque) })
    if (params.fincaId) filters.push({ property: 'fincaId', operator: 'equals', value: params.fincaId })

    return axios.post<PaginatedResponse<PlantacionPermanente>>('/api/plantacion-permanente/search', {
      query: params.query || '',
      filter: filters,
      pageSize: params.size || 10,
      page: params.page || 0,
      sortBy: 'numeroInventario',
      sortType: 'ASC'
    })
  },

  getByBloque(bloque: number) {
    return axios.get<PlantacionPermanente[]>(`/api/plantacion-permanente/bloque/${bloque}`)
  },

  getByTipoPlantacion(tipoPlantacion: TipoPlantacion) {
    return axios.get<PlantacionPermanente[]>(`/api/plantacion-permanente/tipo/${tipoPlantacion}`)
  },

  getByFinca(fincaId: string) {
    return axios.get<PlantacionPermanente[]>(`/api/plantacion-permanente/finca/${fincaId}`)
  },

  getResumenPorTipo(fincaId: string) {
    return axios.get<ResumenPlantacion[]>(`/api/plantacion-permanente/finca/${fincaId}/resumen`)
  },

  getTiposPlantacion() {
    return axios.get<TipoPlantacion[]>('/api/plantacion-permanente/tipos-plantacion')
  },

  getTiposCepa() {
    return axios.get<string[]>('/api/plantacion-permanente/tipos-cepa')
  }
}

// ==================== DEPRECIACION ====================
const DepreciacionService = {
  calcularDepreciacionMensual(activoFijoId: string) {
    return axios.get<{ depreciacionMensual: number }>(`/api/depreciacion/calcular/${activoFijoId}`)
  },

  ejecutarCierreMensual(mes: number, anio: number) {
    return axios.post<{
      mensaje: string
      movimientos: MovimientoDepreciacion[]
      totalMovimientos: number
    }>('/api/depreciacion/cierre-mensual', { mes, anio })
  },

  ejecutarCierreActivo(activoFijoId: string, mes: number, anio: number) {
    return axios.post<MovimientoDepreciacion>(`/api/depreciacion/cierre-activo/${activoFijoId}`, { mes, anio })
  },

  getByActivoFijo(activoFijoId: string) {
    return axios.get<MovimientoDepreciacion[]>(`/api/depreciacion/activo/${activoFijoId}`)
  },

  getByPeriodo(mes: number, anio: number) {
    return axios.get<MovimientoDepreciacion[]>(`/api/depreciacion/periodo/${mes}/${anio}`)
  },

  generarReporteAnual(anio: number) {
    return axios.get<ReporteDepreciacion[]>(`/api/depreciacion/reporte-anual/${anio}`)
  },

  existeCierre(mes: number, anio: number) {
    return axios.get<{ existeCierre: boolean }>(`/api/depreciacion/existe-cierre/${mes}/${anio}`)
  }
}

export {
  GrupoActivoFijoService,
  ActivoFijoService,
  ActivoAnimalService,
  PlantacionService,
  DepreciacionService
}
