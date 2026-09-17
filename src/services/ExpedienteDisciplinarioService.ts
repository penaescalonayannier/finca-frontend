import axios, { type AxiosResponse } from 'axios'

const BASE_URL = '/api/expedientes-disciplinarios'
export type TipoIncidencia = 'TARDANZA' | 'AUSENCIA' | 'INCUMPLIMIENTO' | 'OTRA'
export type EstadoExpediente = 'BORRADOR' | 'NOTIFICADA' | 'RESUELTA' | 'ANULADA'
export interface ExpedienteDisciplinario { id:string; fincaId:string; fincaNombre?:string; trabajadorId:string; trabajadorNombre?:string; aprobadorId?:string; aprobadorNombre?:string; tipo:TipoIncidencia; estado:EstadoExpediente; fecha:string; descripcion:string; evidencia?:string; observaciones?:string; medida?:string; resolucion?:string; fechaNotificacion?:string; fechaResolucion?:string; fechaAnulacion?:string; motivoAnulacion?:string }
export interface CrearExpediente { fincaId:string; trabajadorId:string; aprobadorId?:string; tipo:TipoIncidencia; fecha:string; descripcion:string; evidencia?:string; observaciones?:string }
export interface ResolverExpediente { aprobadorId?:string; medida:string; resolucion:string; observaciones?:string }
class ExpedienteDisciplinarioService {
  listar(params:{fincaId:string; trabajadorId?:string; desde?:string; hasta?:string; incluirAnulados?:boolean}):Promise<AxiosResponse<ExpedienteDisciplinario[]>> { return axios.get(BASE_URL,{params}) }
  obtener(id:string):Promise<AxiosResponse<ExpedienteDisciplinario>> { return axios.get(`${BASE_URL}/${id}`) }
  crear(data:CrearExpediente):Promise<AxiosResponse<{id:string}>> { return axios.post(BASE_URL,data) }
  actualizar(id:string,data:Omit<CrearExpediente,'fincaId'|'trabajadorId'>):Promise<AxiosResponse<void>> { return axios.put(`${BASE_URL}/${id}`,data) }
  notificar(id:string):Promise<AxiosResponse<void>> { return axios.post(`${BASE_URL}/${id}/notificar`) }
  resolver(id:string,data:ResolverExpediente):Promise<AxiosResponse<void>> { return axios.post(`${BASE_URL}/${id}/resolver`,data) }
  anular(id:string,motivo:string):Promise<AxiosResponse<void>> { return axios.post(`${BASE_URL}/${id}/anular`,{motivo}) }
  pdf(id:string):Promise<AxiosResponse<Blob>> { return axios.get(`${BASE_URL}/${id}/pdf`,{responseType:'blob'}) }
}
export default new ExpedienteDisciplinarioService()
