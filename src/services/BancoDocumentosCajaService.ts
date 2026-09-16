import axios, { type AxiosResponse } from 'axios'
import type { DenominacionCantidad } from './LiquidacionCajaService'

export type TipoDocumentoCaja = 'RECIBO_EFECTIVO' | 'VALE_PAGO_MENOR' | 'ANTICIPO' | 'LIQUIDACION_ANTICIPO' | 'REEMBOLSO'
export interface DocumentoCaja { id:string; fincaId:string; numero?:string; tipo:TipoDocumentoCaja; fecha:string; concepto:string; importe:number; beneficiario?:string; entregadoPor?:string; recibidoPor?:string; autorizadoPor?:string; referencia?:string; registrarMovimientoCaja?:boolean; sentidoCaja?:'INGRESO'|'EGRESO'; denominaciones?:DenominacionCantidad[]; estado:'VIGENTE'|'ANULADO'|string; observaciones?:string }
export interface DocumentoCajaRequest { fincaId:string; tipo:TipoDocumentoCaja; fecha?:string; concepto:string; importe:number; beneficiario:string; entregadoPor?:string; recibidoPor?:string; autorizadoPor?:string; referencia?:string; observaciones?:string; registrarMovimientoCaja?:boolean; sentidoCaja?:'INGRESO'|'EGRESO'; denominaciones?:DenominacionCantidad[] }
export interface ChequeTransferencia { id:string; fincaId:string; tipo:'CHEQUE'|'TRANSFERENCIA'|string; numero?:string; fecha:string; beneficiario:string; concepto:string; importe:number; referenciaBancaria?:string; estado:'PENDIENTE'|'CONFIRMADO'|'ANULADO'|string; fechaConfirmacion?:string }
export interface ChequeTransferenciaRequest { fincaId:string; tipo:'CHEQUE'|'TRANSFERENCIA'; fechaEmision?:string; beneficiario:string; concepto:string; importe:number; referenciaBancaria?:string; autorizadoPor:string; emitidoPor:string; observaciones?:string }
export interface MovimientoConciliacion { id:string; fecha:string; descripcion:string; referencia?:string; importe:number; origen?:string; conciliado:boolean; observaciones?:string }
export interface ConciliacionBancaria { id:string; fincaId:string; periodo:string; saldoExtracto:number; saldoLibros:number; diferencia:number; responsable:string; observaciones?:string; estado:'ABIERTA'|'CERRADA'|string; movimientos?:MovimientoConciliacion[]; fecha?:string }
export interface ConciliacionRequest { fincaId:string; periodo:string; saldoExtracto:number; saldoLibros:number; responsable:string; observaciones?:string; movimientos:MovimientoConciliacion[] }

const DOC = '/api/documentos-caja'; const BANCO = '/api/banco'
class BancoDocumentosCajaService {
  listarDocumentos(fincaId:string):Promise<AxiosResponse<DocumentoCaja[]>> { return axios.get(DOC,{params:{fincaId}}) }
  obtenerDocumento(id:string):Promise<AxiosResponse<DocumentoCaja>> { return axios.get(`${DOC}/${id}`) }
  crearDocumento(data:DocumentoCajaRequest):Promise<AxiosResponse<{id:string}>> { return axios.post(DOC,data) }
  anularDocumento(id:string, observaciones:string):Promise<AxiosResponse<void>> { return axios.post(`${DOC}/${id}/anular`,{observaciones}) }
  descargarDocumentoPdf(id:string):Promise<AxiosResponse<Blob>> { return axios.get(`${DOC}/${id}/pdf`,{responseType:'blob'}) }
  listarCheques(fincaId:string):Promise<AxiosResponse<ChequeTransferencia[]>> { return axios.get(`${BANCO}/cheques-transferencias`,{params:{fincaId}}) }
  crearCheque(data:ChequeTransferenciaRequest):Promise<AxiosResponse<{id:string}>> { return axios.post(`${BANCO}/cheques-transferencias`,data) }
  confirmarCheque(id:string, cobrado:boolean, observaciones?:string):Promise<AxiosResponse<void>> { return axios.post(`${BANCO}/cheques-transferencias/${id}/confirmar`,{cobrado,observaciones}) }
  listarConciliaciones(fincaId:string):Promise<AxiosResponse<ConciliacionBancaria[]>> { return axios.get(`${BANCO}/conciliaciones`,{params:{fincaId}}) }
  obtenerConciliacion(id:string):Promise<AxiosResponse<ConciliacionBancaria>> { return axios.get(`${BANCO}/conciliaciones/${id}`) }
  crearConciliacion(data:ConciliacionRequest):Promise<AxiosResponse<{id:string}>> { return axios.post(`${BANCO}/conciliaciones`,data) }
  cerrarConciliacion(id:string, observaciones?:string):Promise<AxiosResponse<void>> { return axios.post(`${BANCO}/conciliaciones/${id}/cerrar`,{observaciones}) }
}
export default new BancoDocumentosCajaService()
