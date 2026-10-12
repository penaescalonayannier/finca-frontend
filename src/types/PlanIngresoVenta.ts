export type EstadoPlanIngresoVenta = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'CERRADO' | 'ANULADO'

export interface ElementoPlanIngresoVenta {
  id?: string
  orden?: number
  productoCodigoSnapshot?: string
  productoNombreSnapshot: string
  unidadMedidaSnapshot: string
  tipoPrecioSnapshot?: string
  cantidadPlanificada: number
  precioUnitarioSnapshot: number
  importePlanificado?: number
}

export interface PlanIngresoVenta {
  id: string
  fincaId: string
  periodo: string
  estado: EstadoPlanIngresoVenta
  pagosSalario: number
  porcentajeAportePresupuesto: number
  aportePresupuesto: number
  pagosCompras: number
  comprasServicios: number
  totalIngresosPlanificados: number
  totalEgresos: number
  disponible: number
  observaciones?: string
  elementos: ElementoPlanIngresoVenta[]
  actividades: ActividadPlanMensual[]
}

/** Meta agrícola del período. Los importes son instantáneas para no alterar el plan histórico. */
export interface ActividadPlanMensual {
  id?: string
  orden?: number
  tipoCultivoId?: string
  tipoCultivoNombreSnapshot: string
  codigoCentroCosto?: string
  centroCostoNombreSnapshot?: string
  laborAgricolaId?: string
  laborAgricolaCodigoSnapshot?: string
  actividad: string
  bloqueSnapshot?: string
  campoSnapshot?: string
  unidadMedidaSnapshot: string
  areaPlanificada: number
  cantidadMeta: number
  pagoSalario: number
  compras: number
  servicios: number
  totalPlanificado?: number
  dotaciones?: DotacionPlanMensual[]
  gastos?: GastoPlanMensual[]
}

/** Gasto directo, persistido y agrupable por centro de costo. */
export interface GastoPlanMensual {
  id?: string
  orden?: number
  codigoCentroCosto?: string
  categoria: string
  subcategoria?: string
  descripcion: string
  unidadMedidaSnapshot?: string
  cantidad: number
  precioUnitarioSnapshot: number
  importe?: number
}

/** Dotación prevista por cargo. El salario de escala se conserva como fotografía del plan. */
export interface DotacionPlanMensual {
  id?: string
  orden?: number
  cargoId?: string
  cargoNombreSnapshot: string
  salarioEscalaSnapshot: number
  cantidadTrabajadores: number
  diasPlanificados: number
  horasPorDia: number
  salarioPlanificado?: number
}

export interface EjecucionActividadPlanMensual {
  tipoCultivoNombre?: string
  actividad?: string
  cantidadPlanificada: number
  cantidadReal: number
  salarioPlanificado: number
  salarioReal: number
  comprasPlanificadas: number
  comprasReales: number
  serviciosPlanificados: number
  serviciosReales: number
}

export interface EjecucionPlanMensual {
  planId: string
  periodo: string
  totalIngresosPlanificados: number
  totalIngresosReales: number
  totalEgresosPlanificados: number
  totalEgresosReales: number
  disponiblePlanificado: number
  disponibleReal: number
  actividades: EjecucionActividadPlanMensual[]
}

export interface PlanIngresoVentaRequest {
  fincaId: string
  periodo: string
  pagosSalario: number
  porcentajeAportePresupuesto?: number
  pagosCompras: number
  comprasServicios: number
  observaciones?: string
  elementos: Array<Pick<ElementoPlanIngresoVenta,
    'productoCodigoSnapshot' | 'productoNombreSnapshot' | 'unidadMedidaSnapshot' |
    'tipoPrecioSnapshot' | 'cantidadPlanificada' | 'precioUnitarioSnapshot'>>
  actividades?: Array<Omit<ActividadPlanMensual, 'id' | 'orden' | 'totalPlanificado'>>
}
