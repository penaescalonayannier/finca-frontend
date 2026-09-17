import axios from 'axios'
export type LineaConteoFisico = { id: string; almacenFincaProductoId: string; productoCodigo: string; productoNombre: string; unidadMedida?: string; existenciaTeorica: number; existenciaFisica?: number; diferencia?: number; observaciones?: string }
export type ConteoFisico = { id:string; fincaId:string; almacenId:string; almacenNombre:string; numero:string; estado:'ABIERTO'|'CERRADO'; fechaApertura:string; fechaCierre?:string; responsableConteo:string; verificadoPor?:string; autorizadoPor?:string; observacionesApertura?:string; observacionesCierre?:string; numeroAjuste?:string; lineas:LineaConteoFisico[] }
export type CrearConteoFisico = { almacenId:string; responsableConteo:string; verificadoPor?:string; observaciones?:string }
class ConteoFisicoAlmacenService { private base='/api/conteos-fisicos-almacen'
 abrir(data:CrearConteoFisico){return axios.post<{id:string}>(this.base,data)}
 listar(fincaId:string){return axios.get<ConteoFisico[]>(this.base,{params:{fincaId}})}
 detalle(id:string){return axios.get<ConteoFisico>(`${this.base}/${id}`)}
 cerrar(id:string,data:{lineas:Array<{lineaId:string;cantidadContada:number;observaciones?:string}>;observaciones?:string;autorizadoPor:string}){return axios.put(`${this.base}/${id}/cerrar`,data)}
 pdf(id:string){return axios.get(`${this.base}/${id}/pdf`,{responseType:'blob'})}
}
export default new ConteoFisicoAlmacenService()
