/**
 * Configuration for company data on official Cuban documents.
 * Required fields based on Resolución 11/2007 and 55/2021 del MFP.
 */
export interface ConfiguracionEmpresa {
  id?: string
  nombre: string
  codigo?: string
  nit: string
  direccion?: string
  municipio?: string
  provincia?: string
  cuentaBancaria?: string
  banco?: string
  telefono?: string
  email?: string
  activo?: boolean
}
