import axios from 'axios'
import type { AreaTrabajo, Plaza } from '@/types/EstructuraOrganizativa'

const areasUrl = '/api/areas-trabajo'
const plazasUrl = '/api/plazas'

export default {
  listarAreas (fincaId: string) { return axios.get<AreaTrabajo[]>(areasUrl, { params: { fincaId } }) },
  crearArea (data: AreaTrabajo) { return axios.post<AreaTrabajo>(areasUrl, data) },
  actualizarArea (id: string, data: AreaTrabajo) { return axios.put<AreaTrabajo>(`${areasUrl}/${id}`, data) },
  desactivarArea (id: string) { return axios.delete(`${areasUrl}/${id}`) },
  listarPlazas (fincaId: string) { return axios.get<Plaza[]>(plazasUrl, { params: { fincaId } }) },
  crearPlaza (data: Plaza) { return axios.post<Plaza>(plazasUrl, data) },
  actualizarPlaza (id: string, data: Plaza) { return axios.put<Plaza>(`${plazasUrl}/${id}`, data) },
  desactivarPlaza (id: string) { return axios.delete(`${plazasUrl}/${id}`) },
  asignarTrabajador (plazaId: string, trabajadorId: string) { return axios.post<Plaza>(`${plazasUrl}/${plazaId}/asignar-trabajador/${trabajadorId}`) },
  desasignarTrabajador (plazaId: string) { return axios.post<Plaza>(`${plazasUrl}/${plazaId}/desasignar-trabajador`) }
}
