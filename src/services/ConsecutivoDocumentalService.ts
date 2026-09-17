import axios, { type AxiosResponse } from 'axios'

/**
 * Tipos que ya cuentan con una forma oficial en el sistema. El string abierto
 * permite mostrar nuevas formas que el registro central incorpore sin exigir
 * una nueva versión del frontend.
 */
export type TipoConsecutivoDocumentalConocido =
  | 'FACTURA'
  | 'VALE'
  | 'PRODUCCION'
  | 'RECEPCION'
  | 'TRANSFERENCIA_ALMACEN'
  | 'RECIBO'
  | 'CONTEO_FISICO'
  | 'AJUSTE_INVENTARIO'

export type TipoConsecutivoDocumental = TipoConsecutivoDocumentalConocido | (string & NonNullable<unknown>)

export interface FormaNumeradaDocumental {
  codigo?: string
  nombre?: string
  modeloOficial?: string
}

export interface AlcanceFormaNumerada {
  tipo?: string
  descripcion?: string
  finca?: string
  almacen?: string
  caja?: string
}

/** Vista de auditoría. Los números son asignados exclusivamente por el backend. */
export interface ConsecutivoDocumental {
  tipo: TipoConsecutivoDocumental
  prefijo?: string
  anio?: number
  ultimoNumero?: number
  proximoNumero?: string | number
  cantidadDocumentos?: number
  integridad?: boolean
  /** Campos opcionales del registro de formas numeradas. */
  forma?: string | FormaNumeradaDocumental
  formaCodigo?: string
  formaNombre?: string
  modeloOficial?: string
  serie?: string
  alcance?: string | AlcanceFormaNumerada
  alcanceDescripcion?: string
  estado?: string
}

class ConsecutivoDocumentalService {
  consultar(fincaId: string, anio: number): Promise<AxiosResponse<ConsecutivoDocumental[]>> {
    return axios.get('/api/numeracion', { params: { fincaId, anio } })
  }

  /**
   * Usa el registro central cuando esté disponible. Mientras se despliega el
   * backend nuevo, conserva la consulta histórica para no interrumpir la
   * auditoría de consecutivos ya operativa.
   */
  async consultarRegistro(fincaId: string, anio: number): Promise<AxiosResponse<ConsecutivoDocumental[]>> {
    try {
      const response = await axios.get<ConsecutivoDocumental[]>('/api/numeracion/formas', { params: { fincaId, anio } })
      return {
        ...response,
        // El registro formal usa códigos de forma; la consulta histórica usa
        // nombres documentales. Se normalizan para que la actualización no
        // duplique filas mientras ambas rutas conviven.
        data: response.data.map(registro => ({
          ...registro,
          tipo: ({
            VALE_SALIDA: 'VALE',
            PRODUCCION_TERMINADA: 'PRODUCCION',
            INFORME_RECEPCION: 'RECEPCION',
            RECIBO_COBRO: 'RECIBO'
          } as Record<string, TipoConsecutivoDocumental>)[registro.tipo] || registro.tipo
        }))
      }
    } catch (error) {
      if (axios.isAxiosError(error) && [404, 405].includes(error.response?.status ?? 0)) {
        return this.consultar(fincaId, anio)
      }
      throw error
    }
  }
}

export default new ConsecutivoDocumentalService()
