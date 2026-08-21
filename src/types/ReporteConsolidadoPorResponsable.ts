// src/types/ReporteConsolidadoPorResponsable.ts

export interface TrabajadorConsolidado {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string | null
  cuenta: string
  horasPorDia: Record<number, string>
  normaPorDia?: Record<number, string>
  totalHoras: number
  totalNorma?: number
}

export interface ResponsableConsolidado {
  trabajadorResponsableId: string
  trabajadorResponsableNombre: string
  trabajadores: TrabajadorConsolidado[]
}

export interface ReporteConsolidadoPorResponsable {
  year: string
  mes: string
  responsables: ResponsableConsolidado[]
}
