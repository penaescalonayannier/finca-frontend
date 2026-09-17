import axios from 'axios'
import type { HistorialSalario } from '@/types/HistorialSalario'

const baseUrl = '/api/historial-salarial'
export default {
  listar: (trabajadorId: string) => axios.get<HistorialSalario[]>(`${baseUrl}/trabajador/${trabajadorId}`),
  vigente: (trabajadorId: string) => axios.get<HistorialSalario>(`${baseUrl}/trabajador/${trabajadorId}/vigente`),
  registrar: (salario: HistorialSalario) => axios.post<{ id: string }>(baseUrl, salario),
  anular: (id: string, motivo: string) => axios.post(`${baseUrl}/${id}/anular`, { motivo })
}
