// src/types/ActivoFijo.ts
// Tipos para el módulo de Activos Fijos Tangibles
// Referencia: NCC No. 7 (Resolución 1038/2017 MFP)

// ==================== ENUMS ====================
export enum CategoriaAnimal {
  TERNERO = 'TERNERO',
  ANOJO = 'ANOJO',
  TORETE = 'TORETE',
  NOVILLA = 'NOVILLA',
  BUEY = 'BUEY',
  VACA = 'VACA',
  TORO = 'TORO',
  SEMENTAL = 'SEMENTAL',
  CABALLO = 'CABALLO',
  YEGUA = 'YEGUA',
  POTRO = 'POTRO',
  MULO = 'MULO',
  CERDO = 'CERDO',
  OVEJA = 'OVEJA',
  CABRA = 'CABRA',
  OTRO = 'OTRO'
}

export const categoriaAnimalLabels: Record<CategoriaAnimal, string> = {
  [CategoriaAnimal.TERNERO]: 'Ternero (0-1 año)',
  [CategoriaAnimal.ANOJO]: 'Añojo (1-2 años)',
  [CategoriaAnimal.TORETE]: 'Torete (2-3 años)',
  [CategoriaAnimal.NOVILLA]: 'Novilla (2-3 años)',
  [CategoriaAnimal.BUEY]: 'Buey (trabajo)',
  [CategoriaAnimal.VACA]: 'Vaca',
  [CategoriaAnimal.TORO]: 'Toro',
  [CategoriaAnimal.SEMENTAL]: 'Semental',
  [CategoriaAnimal.CABALLO]: 'Caballo',
  [CategoriaAnimal.YEGUA]: 'Yegua',
  [CategoriaAnimal.POTRO]: 'Potro',
  [CategoriaAnimal.MULO]: 'Mulo/Mula',
  [CategoriaAnimal.CERDO]: 'Cerdo',
  [CategoriaAnimal.OVEJA]: 'Oveja',
  [CategoriaAnimal.CABRA]: 'Cabra',
  [CategoriaAnimal.OTRO]: 'Otro'
}

export enum TipoGanado {
  VACUNO = 'VACUNO',
  EQUINO = 'EQUINO',
  PORCINO = 'PORCINO',
  OVINO = 'OVINO',
  CAPRINO = 'CAPRINO',
  AVICOLA = 'AVICOLA'
}

export const tipoGanadoLabels: Record<TipoGanado, string> = {
  [TipoGanado.VACUNO]: 'Vacuno',
  [TipoGanado.EQUINO]: 'Equino',
  [TipoGanado.PORCINO]: 'Porcino',
  [TipoGanado.OVINO]: 'Ovino',
  [TipoGanado.CAPRINO]: 'Caprino',
  [TipoGanado.AVICOLA]: 'Avícola'
}

export enum TipoCepa {
  SQ = 'SQ',    // Siembra Quedada
  RQ = 'RQ',    // Retoño Quedado
  R1 = 'R1',    // Retoño 1
  R2 = 'R2',    // Retoño 2
  R3 = 'R3',    // Retoño 3
  R4 = 'R4',    // Retoño 4
  R5 = 'R5'     // Retoño 5
}

export const tipoCepaLabels: Record<TipoCepa, string> = {
  [TipoCepa.SQ]: 'S/Q - Siembra Quedada',
  [TipoCepa.RQ]: 'R/Q - Retoño Quedado',
  [TipoCepa.R1]: 'R/1 - Retoño 1',
  [TipoCepa.R2]: 'R/2 - Retoño 2',
  [TipoCepa.R3]: 'R/3 - Retoño 3',
  [TipoCepa.R4]: 'R/4 - Retoño 4',
  [TipoCepa.R5]: 'R/5 - Retoño 5'
}

export enum TipoPlantacion {
  CANA = 'CANA',
  PLATANO = 'PLATANO',
  MANGO = 'MANGO',
  GUAYABA = 'GUAYABA',
  CITRICOS = 'CITRICOS',
  CAFE = 'CAFE',
  CACAO = 'CACAO',
  OTROS = 'OTROS'
}

export const tipoPlantacionLabels: Record<TipoPlantacion, string> = {
  [TipoPlantacion.CANA]: 'Caña de Azúcar',
  [TipoPlantacion.PLATANO]: 'Plátano',
  [TipoPlantacion.MANGO]: 'Mango',
  [TipoPlantacion.GUAYABA]: 'Guayaba',
  [TipoPlantacion.CITRICOS]: 'Cítricos',
  [TipoPlantacion.CAFE]: 'Café',
  [TipoPlantacion.CACAO]: 'Cacao',
  [TipoPlantacion.OTROS]: 'Otros Frutales'
}

// ==================== INTERFACES ====================
export interface GrupoActivoFijo {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tasaDepreciacion?: number
  vidaUtilAnios?: number
  cuentaContable?: string
  activo: boolean
}

export interface ActivoFijoTangible {
  id: string
  numeroInventario: string
  descripcion: string
  grupoId?: string
  grupoCodigo?: string
  grupoNombre?: string
  fincaId?: string
  fincaNombre?: string
  valorAdquisicion: number
  depreciacionAcumulada: number
  valorResidual?: number
  estadoTecnicoPorcentaje?: number
  valorTasacion?: number
  fechaAdquisicion?: string
  fechaBaja?: string
  destino?: string
  observaciones?: string
  activo: boolean
}

export interface ActivoAnimal {
  id: string
  activoFijoId?: string
  numeroInventario?: string
  descripcion?: string
  categoria: CategoriaAnimal
  tipoGanado: TipoGanado
  aniosVida?: number
  pesoPromedio?: number
  hierro?: string
  codigoArete?: string
  valorAdquisicion: number
  depreciacionAcumulada?: number
  valorTasacion?: number
  destino?: string
  fincaId?: string
  fincaNombre?: string
}

export interface PlantacionPermanente {
  id: string
  activoFijoId?: string
  numeroInventario?: string
  descripcion?: string
  tipoPlantacion: TipoPlantacion
  bloque?: number
  campo?: number
  areaHectareas?: number
  tipoCepa?: TipoCepa
  codigoVariedad?: string
  aniosCepa?: number
  valorAdquisicion: number
  depreciacionAcumulada?: number
  valorTasacion?: number
  destino?: string
  fincaId?: string
  fincaNombre?: string
}

export interface MovimientoDepreciacion {
  id: string
  activoFijoId: string
  numeroInventario?: string
  descripcionActivo?: string
  fecha: string
  mes: number
  anio: number
  montoDepreciacion: number
  depreciacionAcumuladaAnterior: number
  depreciacionAcumuladaNueva: number
  valorResidualResultante: number
  tasaAplicada?: number
  observacion?: string
}

export interface ResumenAnimal {
  categoria: CategoriaAnimal
  cantidad: number
  valorTotal: number
}

export interface ResumenPlantacion {
  tipoPlantacion: TipoPlantacion
  areaTotal: number
  valorTotal: number
  cantidadCampos: number
}

export interface ReporteDepreciacion {
  activoId: string
  numeroInventario: string
  descripcion: string
  codigoGrupo: string
  valorAdquisicion: number
  depreciacionAnual: number
  depreciacionAcumulada: number
  valorResidual: number
  tasaDepreciacion: number
}

// ==================== REQUEST/RESPONSE ====================
export interface CreateActivoFijoRequest {
  numeroInventario: string
  descripcion: string
  grupoId?: string
  fincaId?: string
  valorAdquisicion: number
  depreciacionAcumulada?: number
  estadoTecnicoPorcentaje?: number
  valorTasacion?: number
  fechaAdquisicion?: string
  destino?: string
  observaciones?: string
}

export interface CreateActivoAnimalRequest {
  numeroInventario?: string
  descripcion?: string
  categoria: CategoriaAnimal
  tipoGanado: TipoGanado
  aniosVida?: number
  pesoPromedio?: number
  hierro?: string
  codigoArete?: string
  valorAdquisicion: number
  depreciacionAcumulada?: number
  valorTasacion?: number
  destino?: string
  fincaId?: string
}

export interface CreatePlantacionRequest {
  numeroInventario?: string
  descripcion?: string
  tipoPlantacion: TipoPlantacion
  bloque?: number
  campo?: number
  areaHectareas?: number
  tipoCepa?: TipoCepa
  codigoVariedad?: string
  aniosCepa?: number
  valorAdquisicion: number
  depreciacionAcumulada?: number
  valorTasacion?: number
  destino?: string
  fincaId?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}
