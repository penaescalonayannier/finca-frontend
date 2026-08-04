// src/types/Cargo.ts

export enum Cargo {
  JEFE_FINCA_AGROPECUARIA = 'Jefe de Finca Agropecuaria',
  ESPECIALISTA_A_PRODUCCION_CANA = 'Especialista A en Producción de Caña',
  ESPECIALISTA_A_PRODUCCION_AGROPECUARIA = 'Especialista A en Producción Agropecuaria',
  GESTOR_ADMINISTRATIVO = 'Gestor Administrativo',
  TECNICO_MECANIZACION_AGRICOLA = 'Técnico en Mecanización Agrícola',
  TECNICO_PRODUCCION_AGROPECUARIA = 'Técnico en Producción Agropecuaria',
  INSPECTOR_B_CAMPO = 'Inspector B de Campo',
  TECNICO_ABASTECIMIENTO_TECNICO_MATERIAL = 'Técnico en Abastecimiento Técnico Material',
  CONTADOR_D = 'Contador D',
  MECANICO_B_AUTOMOTOR = 'Mecánico B Automotor',
  SERENO = 'Sereno (Finca)',
  COCINERO_INTEGRAL_C = 'Cocinero Integral "C"',
  OPERARIO_AGROPECUARIO_ESPECIALIZADO = 'Operario Agropecuario Especializado (Caña, Cultivos Varios ó Pecuario)',
  JEFE_BRIGADA_PRODUCCION_AGROPECUARIA = 'Jefe de Brigada de Producción Agropecuaria',
  OPERADOR_TRACTOR_NEUMATICO_ADITAMENTOS = 'Operador de Tractor sobre Neumático con Aditamentos (finca)',
  MECANICO_A_AUTOMOTOR = 'Mecánico A Automotor(Jefe de Brigada)',
  OPERADOR_MECANICO_COMBINADAS_CANERAS = 'Operador Mecánico de Combinadas Cañeras',
  OPERADOR_TRACTOR_NEUMATICOS_ADITAMENTOS = 'Operador de Tractor sobre Neumáticos con Aditamentos (Finca)',
  MECANICO_COMBINADAS_CANERAS = 'Mecánico de Combinadas Cañeras',
  OPERARIO_AGROPECUARIO_ESPECIALIZADO_COMPUTADOR = 'Operario Agropecuario Especializado (Computador-Enganchador)',
  SOLDADOR_B = 'Soldador "B"'
}

export const cargoOptions = Object.values(Cargo)

export const getCargoLabel = (value: string): string => {
  return value
}

// ==================== MAPEO DE ABREVIATURAS ====================
export const cargoAbreviaturas: Record<string, string> = {
  'Jefe de Finca Agropecuaria': 'Jefe Finca',
  'Especialista A en Producción de Caña': 'Esp. Prod. Caña',
  'Especialista A en Producción Agropecuaria': 'Esp. Prod. Agropec.',
  'Gestor Administrativo': 'Gestor Adm.',
  'Técnico en Mecanización Agrícola': 'Téc. Mec. Agrícola',
  'Técnico en Producción Agropecuaria': 'Téc. Prod. Agropec.',
  'Inspector B de Campo': 'Insp. Campo',
  'Técnico en Abastecimiento Técnico Material': 'Téc. Abast. Téc. Mat.',
  'Contador D': 'Contador D',
  'Mecánico B Automotor': 'Mec. B Automotor',
  'Sereno (Finca)': 'Sereno',
  'Cocinero Integral "C"': 'Cocinero C',
  'Operario Agropecuario Especializado (Caña, Cultivos Varios ó Pecuario)': 'Op. Agropec. Esp.',
  'Jefe de Brigada de Producción Agropecuaria': 'Jefe Brig. Prod.',
  'Operador de Tractor sobre Neumático con Aditamentos (finca)': 'Op. Tractor',
  'Mecánico A Automotor(Jefe de Brigada)': 'Mec. A Automotor',
  'Operador Mecánico de Combinadas Cañeras': 'Op. Combinadas',
  'Operador de Tractor sobre Neumáticos con Aditamentos (Finca)': 'Op. Tractor',
  'Mecánico de Combinadas Cañeras': 'Mec. Combinadas',
  'Operario Agropecuario Especializado (Computador-Enganchador)': 'Op. Computador',
  'Soldador "B"': 'Soldador B'
}

export const getCargoAbreviado = (cargo: string): string => {
  return cargoAbreviaturas[cargo] || cargo
}

// ==================== INTERFACES PARA CRUD ====================
export interface CargoEntity {
  id: string
  name: string
  description?: string
  tipoCargo?: string
  anticipoDiario?: number
  salarioEscala?: number
  taza?: number
}

export interface CreateCargoRequest {
  name: string
  description?: string
  salarioEscala?: number
}

export interface UpdateCargoRequest {
  id: string
  name: string
  description?: string
  salarioEscala?: number
}

export interface CargoListResponse {
  data: CargoEntity[]
  totalPages: number
  totalElementsPage: number
  totalElements: number
  size: number
  page: number
}