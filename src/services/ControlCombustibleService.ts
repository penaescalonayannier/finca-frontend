import axios from 'axios'

export interface LineaControlCombustible {
  laborId: string
  actividad: string
  unidadMedida?: string
  nivelActividad?: string
  indicePermisible?: number
  nivelPeriodo: number
  consumoPeriodo: number
  indicePeriodo: number
  nivelAcumulado: number
  consumoAcumulado: number
  indiceAcumulado: number
  desviacion?: number
}

export interface ControlCombustible {
  fincaId: string
  fechaInicio: string
  fechaFin: string
  lineas: LineaControlCombustible[]
}

export default {
  consultar (fincaId: string, fechaInicio: string, fechaFin: string) {
    return axios.get<ControlCombustible>('/api/control-combustible', { params: { fincaId, fechaInicio, fechaFin } })
  }
}
