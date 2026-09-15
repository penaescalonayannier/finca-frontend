// Types for consolidated reports

// ==================== DEUDAS PENDIENTES ====================

export interface ResumenDeudas {
  totalTrabajadores: number
  trabajadoresConDeuda: number
  trabajadoresSinDeuda: number
  montoTotalDeuda: number
  promedioDeuda: number
  deudaMaxima: number
  deudaMinima: number
}

export interface DeudaPorFinca {
  fincaId: string
  fincaCode: string
  fincaName: string
  trabajadoresConDeuda: number
  montoTotal: number
}

export interface DeudaDetalle {
  trabajadorId: string
  trabajadorNombre: string
  trabajadorRuc: string
  fincaId: string
  fincaName: string
  monto: number
  ultimoPagoFecha?: string
  ultimoPagoMonto?: number
}

export interface ReporteDeudasPendientes {
  fecha: string
  resumen: ResumenDeudas
  porFinca: DeudaPorFinca[]
  deudas: DeudaDetalle[]
}

// ==================== FACTURACION ====================

export interface Periodo {
  inicio: string
  fin: string
}

export interface ResumenFacturacion {
  totalDocumentos: number
  totalVales: number
  totalFacturas: number
  cantidadProductos: number
  valorTotal: number
}

export interface DetalleFacturacion {
  finca?: string
  tipo?: string
  destino?: string
  documentos: number
  cantidad: number
  valor: number
  porcentaje: number
}

export interface DocumentoFacturacion {
  id: string
  numero: string
  fecha: string
  producto: string
  cantidad: number
  destino: string
  valor: number
}

export interface ReporteFacturacion {
  periodo: Periodo
  filtros: Record<string, string>
  resumen: ResumenFacturacion
  detalle: DetalleFacturacion[]
  documentos: DocumentoFacturacion[]
}

// ==================== KARDEX CONSOLIDADO ====================

export interface FincaInfo {
  id: string
  code: string
  name: string
}

export interface MovimientoKardex {
  fecha: string
  tipo: string
  cantidad: number
  stockResultante: number
  referencia?: string
  referenciaId?: string
}

export interface EntradasSalidas {
  total: number
  porTipo: Record<string, number>
}

export interface ProductoKardex {
  productoId: string
  productoCode: string
  productoName: string
  unidadMedida?: string
  stockInicial: number
  entradas: EntradasSalidas
  salidas: EntradasSalidas
  stockFinal: number
  movimientos: MovimientoKardex[]
}

export interface TotalesKardex {
  stockInicialTotal: number
  entradasTotal: number
  salidasTotal: number
  stockFinalTotal: number
}

export interface ReporteKardex {
  finca: FincaInfo
  periodo: Periodo
  productos: ProductoKardex[]
  totales: TotalesKardex
}

// ==================== GRAFICO MOVIMIENTOS ====================

export interface SerieGrafico {
  nombre: string
  color: string
  datos: number[]
}

export interface TotalesGrafico {
  entradas: number
  salidas: number
  balance: number
}

export interface ReporteMovimientosGrafico {
  etiquetas: string[]
  series: SerieGrafico[]
  totales: TotalesGrafico
}

export type Granularidad = 'DIA' | 'SEMANA' | 'MES'
export type TipoSalida = 'VALE' | 'FACTURA'

// ==================== ALERTAS STOCK ====================

export type EstadoStock = 'CRITICO' | 'BAJO' | 'NORMAL' | 'EXCESO'

export interface AlertaStock {
  fincaProductoId: string
  fincaCode: string
  fincaName: string
  productoCode: string
  productoName: string
  unidadMedida?: string
  stockActual: number
  stockMinimo: number
  deficit: number
  estado: EstadoStock
}

export interface ResumenAlertas {
  totalProductos: number
  productosCriticos: number
  productosBajos: number
  productosNormales: number
  productosExceso: number
  alertas: AlertaStock[]
}

// ==================== RESUMEN PAGOS ====================

export interface ResumenPagosTotales {
  totalPagos: number
  montoTotal: number
  montoEfectivo: number
  montoTransferencia: number
  porcentajeEfectivo: number
  porcentajeTransferencia: number
}

export interface DetallePagosPorMetodo {
  formaPago: string
  cantidad: number
  monto: number
  porcentaje: number
}

export interface PagoDocumento {
  numeroRecibo: string
  fecha: string
  trabajadorNombre: string
  trabajadorRuc: string
  fincaNombre: string
  monto: number
  formaPago: string
  referenciaBancaria?: string
}

export interface ResumenPagos {
  periodo: Periodo
  filtros: Record<string, string>
  resumen: ResumenPagosTotales
  detallePorMetodo: DetallePagosPorMetodo[]
  documentos: PagoDocumento[]
}

// ==================== RESUMEN VENTAS ====================

export interface ResumenVentasTotales {
  totalSalidas: number
  totalItems: number
  valorTotal: number
  valorPorDestino: Record<string, number>
}

export interface DetalleVentasPorDestino {
  destino: string
  cantidadSalidas: number
  cantidadItems: number
  valor: number
  porcentaje: number
}

export interface VentaDocumento {
  numero: string
  fecha: string
  tipo: string
  destino: string
  fincaNombre: string
  productoNombre: string
  cantidad: number
  valorTotal: number
}

export interface ResumenVentas {
  periodo: Periodo
  filtros: Record<string, string>
  resumen: ResumenVentasTotales
  detallePorDestino: DetalleVentasPorDestino[]
  documentos: VentaDocumento[]
}
