// src/types/ReporteConsolidado.ts

export interface TrabajadorConsolidado {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string | null
  cuenta: string
  horasPorDia: Record<number, string>
  totalHoras: number
}

export interface ReporteConsolidado {
  year: string
  mes: string
  trabajadores: TrabajadorConsolidado[]
}