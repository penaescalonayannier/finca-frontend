import axios from 'axios'

interface DiaExcedido {
  fecha: string
  horas: number
}

interface TrabajadorExcedido {
  trabajadorId: string
  nombre: string
  ruc: string
  cargo: string
  diasExcedidos: DiaExcedido[]
}

interface TrabajadorHorasExcedidasListResponse {
  items: TrabajadorExcedido[]
}

const TrabajadoresExcedidosService = {
  obtenerTrabajadoresConHorasExcedidas(year: string, mes: string) {
    return axios.get<TrabajadorHorasExcedidasListResponse>('/api/reporte/consolidado/trabajadores-excedidos', {
      params: {
        year,
        mes
      }
    })
  }
}

export default TrabajadoresExcedidosService
export type { TrabajadorExcedido, DiaExcedido }
