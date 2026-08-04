// src/types/Metricas.ts

// ==================== AUSENTISMO ====================

export interface AbsentismoResponse {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string
  cuenta: string
  diasLaborables: number
  diasTrabajados: number
  diasFaltados: number
  porcentajeAsistencia: number
  patron: string // CONSECUTIVO, OCASIONAL, VIERNES_LUNES, ALEATORIO
  tendencia: string // MEJORANDO, EMPEORANDO, ESTABLE
}

export interface AbsentismoListResponse {
  items: AbsentismoResponse[]
}

// ==================== PRODUCTIVIDAD ====================

export interface ProductividadResponse {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string
  cuenta: string
  totalHoras: number
  normaEsperada: number
  porcentajeCumplimiento: number
  horasPromedioDia: number
  variabilidad: number
  consistencia: string // ALTA, MEDIA, BAJA
  diasTrabajados: number
}

export interface ProductividadListResponse {
  items: ProductividadResponse[]
}

// ==================== RANKINGS ====================

export interface TrabajadorRankingResponse {
  ranking: number
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string
  indiceProductividad: number
  totalHoras: number
  porcentajeCumplimiento: number
}

export interface RankingResponse {
  cargo: string
  topPerformers: TrabajadorRankingResponse[]
  bottomPerformers: TrabajadorRankingResponse[]
  promedioCargo: number
  totalTrabajadores: number
}

export interface RankingsListResponse {
  items: RankingResponse[]
}

// ==================== HORAS EXCEDIDAS ====================

export interface HorasExcedidasSummaryResponse {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string
  diasExcedidos: number
  totalHorasExcedidas: number
  diasConExceso: string[]
}

export interface HorasExcedidasSummaryListResponse {
  items: HorasExcedidasSummaryResponse[]
}

// ==================== DASHBOARD CONSOLIDADO ====================

export interface MetricasResumen {
  porcentajeAsistenciaPromedio: number
  porcentajeCumplimientoPromedio: number
  trabajadorMasProductivo: TrabajadorRankingResponse | null
  trabajadorMenosProductivo: TrabajadorRankingResponse | null
  totalHorasExceditasEnMes: number
  totalTrabajadores: number
  totalAusentistas: number
}

export interface DashboardResponse {
  ausentismo: AbsentismoListResponse
  productividad: ProductividadListResponse
  rankings: RankingsListResponse
  horasExcedidas: HorasExcedidasSummaryListResponse
  resumen: MetricasResumen
}

// ==================== FILTROS ====================

export interface FiltrosReporte {
  year: string
  mes: string
  cargo?: string
  trabajadorId?: string
  minAsistencia?: number
  maxAsistencia?: number
}
