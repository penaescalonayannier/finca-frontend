import axios, { type AxiosResponse } from 'axios'

export type TipoConsecutivoDocumental = 'FACTURA' | 'VALE' | 'PRODUCCION'

/** Vista de auditoría. Los números son asignados exclusivamente por el backend. */
export interface ConsecutivoDocumental {
  tipo: TipoConsecutivoDocumental
  prefijo: string
  anio: number
  ultimoNumero: number
  proximoNumero: string
  cantidadDocumentos: number
  integridad: boolean
}

class ConsecutivoDocumentalService {
  consultar(fincaId: string, anio: number): Promise<AxiosResponse<ConsecutivoDocumental[]>> {
    return axios.get('/api/numeracion', { params: { fincaId, anio } })
  }
}

export default new ConsecutivoDocumentalService()
