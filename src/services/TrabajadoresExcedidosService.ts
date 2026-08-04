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

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const TrabajadoresExcedidosService = {
  obtenerTrabajadoresConHorasExcedidas(year: string, mes: string) {
    return api.get<TrabajadorHorasExcedidasListResponse>('/reporte/consolidado/trabajadores-excedidos', {
      params: {
        year,
        mes
      }
    })
  }
}

export default TrabajadoresExcedidosService
export type { TrabajadorExcedido, DiaExcedido }
