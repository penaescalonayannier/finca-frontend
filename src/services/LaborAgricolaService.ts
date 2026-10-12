import axios, { type AxiosResponse } from 'axios'
import type { LaborAgricola, LaborAgricolaRequest } from '@/types/LaborAgricola'

const API_BASE_URL = '/api/labor-agricola'

interface ResultadoPaginado<T> { data?: T[]; content?: T[] }
interface LaborAgricolaApi {
  id: string
  code: string
  name: string
  activo: boolean
  tipoCultivoId?: string
  unidadMedida?: string
  normaRendimiento?: number
  indiceConsumo?: number
  nivelActividad?: string
}

const aLaborAgricola = (labor: LaborAgricolaApi): LaborAgricola => ({
  id: labor.id,
  codigo: labor.code,
  nombre: labor.name,
  tipoCultivoId: labor.tipoCultivoId,
  unidadMedida: labor.unidadMedida || '',
  normaPorUnidad: labor.normaRendimiento,
  indiceConsumo: labor.indiceConsumo,
  nivelActividad: labor.nivelActividad,
  activo: labor.activo,
  dotaciones: []
})

const aSolicitudApi = (datos: LaborAgricolaRequest) => ({
  code: datos.codigo,
  name: datos.nombre,
  activo: datos.activo,
  tipoCultivoId: datos.tipoCultivoId || undefined,
  unidadMedida: datos.unidadMedida,
  normaRendimiento: datos.normaPorUnidad || 0,
  indiceConsumo: datos.indiceConsumo || undefined,
  nivelActividad: datos.nivelActividad?.trim() || undefined
})

class LaborAgricolaService {
  async listar (): Promise<LaborAgricola[]> {
    const response: AxiosResponse<ResultadoPaginado<LaborAgricolaApi> | LaborAgricolaApi[]> = await axios.post(`${API_BASE_URL}/search`, {
      filter: [], query: '', page: 0, pageSize: 999, sortBy: 'name', sortType: 'ASC'
    })
    const datos = Array.isArray(response.data) ? response.data : (response.data.data || response.data.content || [])
    return datos.map(aLaborAgricola)
  }

  crear (datos: LaborAgricolaRequest) { return axios.post(API_BASE_URL, aSolicitudApi(datos)) }
  actualizar (id: string, datos: LaborAgricolaRequest) { return axios.put(`${API_BASE_URL}/${id}`, aSolicitudApi(datos)) }
  eliminar (id: string) { return axios.delete(`${API_BASE_URL}/${id}`) }
}

export default new LaborAgricolaService()
