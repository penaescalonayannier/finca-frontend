<!-- src/components/TrabajadorReporteList.vue -->

<template>
  <div class="trabajador-reporte-list">
    <h2>Gestión de Asignaciones Trabajador - Reporte</h2>

    <div class="search-bar">
      <div class="search-filters">
        <select v-model="filtroTrabajador" class="filter-select">
          <option value="">Todos los trabajadores</option>
          <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
            {{ trabajador.nombre }} - {{ trabajador.ruc }}
          </option>
        </select>

        <select v-model="filtroReporte" class="filter-select">
          <option value="">Todos los reportes</option>
          <option v-for="reporte in reportes" :key="reporte.id" :value="reporte.id">
            {{ reporte.codigo }} - {{ reporte.bloque }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          placeholder="Buscar por norma o horas..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>
      
      <div class="button-group">
        <button @click="buscarConReset" class="btn-buscar">Buscar</button>
        <button @click="abrirModalAsignar" class="btn-crear">Asignar Trabajador</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Cargando asignaciones...</div>

    <table v-else class="asignacion-table">
      <thead>
        <tr>
          <th>Trabajador</th>
          <th>Reporte</th>
          <th>Norma</th>
          <th>Horas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="asignaciones.length === 0">
          <td colspan="5" class="no-data">No se encontraron asignaciones</td>
        </tr>
        <tr v-for="asignacion in asignacionesConDetalles" :key="asignacion.id">
          <td>
            <strong>{{ obtenerNombreTrabajador(asignacion.trabajador) }}</strong>
            <span class="subtext">{{ obtenerRucTrabajador(asignacion.trabajador) }}</span>
          </td>
          <td>
            <strong>{{ obtenerCodigoReporte(asignacion.reporte) }}</strong>
            <span class="subtext">{{ obtenerBloqueReporte(asignacion.reporte) }} / {{ obtenerCampoReporte(asignacion.reporte) }}</span>
          </td>
          <td><span class="norma-badge">{{ asignacion.norma }}</span></td>
          <td><span class="horas-badge">{{ asignacion.horas }}</span></td>
          <td class="acciones">
            <button @click="editarAsignacion(asignacion)" class="btn-editar">✏️ Editar</button>
            <button @click="confirmarEliminar(asignacion)" class="btn-eliminar">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && asignaciones.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="150">150</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button class="btn-pag" :disabled="paginaActual === 0" @click="cambiarPagina(paginaActual - 1)">
          Anterior
        </button>
        <span class="page-indicator">Página {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Asignar/Editar -->
    <div v-if="mostrarModalAsignar" class="modal">
      <div class="modal-content modal-asignar">
        <span class="close" @click="cerrarModalAsignar">&times;</span>
        <CrearTrabajadorReporte
          @created="handleAsignacionCreada"
          @cancel="cerrarModalAsignar"
        />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content modal-asignar">
        <span class="close" @click="cerrarModalEditar">&times;</span>
        <CrearTrabajadorReporte
          :asignacion="asignacionEditando"
          @updated="handleAsignacionActualizada"
          @cancel="cerrarModalEditar"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TrabajadorReporteService from '@/services/TrabajadorReporteService'
import TrabajadorService from '@/services/TrabajadorService'
import ReporteService from '@/services/ReporteService'
import CrearTrabajadorReporte from './CrearTrabajadorReporte.vue'
import type { TrabajadorReporte } from '@/types/TrabajadorReporte'
import type { Trabajador } from '@/types/Trabajador'
import type { Reporte } from '@/types/Reporte'
import type { SearchFilter } from '@/types/EstadoCuenta'
import type { AxiosError } from 'axios'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'

// Estado
const asignaciones = ref<TrabajadorReporte[]>([])
const trabajadores = ref<Trabajador[]>([])
const reportes = ref<Reporte[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const filtroTrabajador = ref('')
const filtroReporte = ref('')

// Modales
const mostrarModalAsignar = ref(false)
const mostrarModalEditar = ref(false)
const asignacionEditando = ref<TrabajadorReporte | null>(null)

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

// Asignaciones con detalles enriquecidos
const asignacionesConDetalles = computed(() => {
  return asignaciones.value.map(asignacion => ({
    ...asignacion,
    // Mantener los datos originales
  }))
})

// Funciones para obtener datos de trabajadores
const obtenerNombreTrabajador = (trabajadorId: string | undefined): string => {
  if (!trabajadorId) return 'ID no disponible'
  const trabajador = trabajadores.value.find(t => t.id === trabajadorId)
  return trabajador?.nombre || trabajadorId
}

const obtenerRucTrabajador = (trabajadorId: string | undefined): string => {
  if (!trabajadorId) return ''
  const trabajador = trabajadores.value.find(t => t.id === trabajadorId)
  return trabajador?.ruc || ''
}

// Funciones para obtener datos de reportes
const obtenerCodigoReporte = (reporteId: string | undefined): string => {
  if (!reporteId) return 'ID no disponible'
  const reporte = reportes.value.find(r => r.id === reporteId)
  return reporte?.codigo || reporteId
}

const obtenerBloqueReporte = (reporteId: string | undefined): string => {
  if (!reporteId) return ''
  const reporte = reportes.value.find(r => r.id === reporteId)
  return reporte?.bloque || ''
}

const obtenerCampoReporte = (reporteId: string | undefined): string => {
  if (!reporteId) return ''
  const reporte = reportes.value.find(r => r.id === reporteId)
  return reporte?.campo || ''
}

// Métodos
const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const cargarReportes = async () => {
  try {
    const response = await ReporteService.buscarReportes({ size: 999 })
    reportes.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar reportes:', error)
  }
}

const cargarAsignaciones = async () => {
  isLoading.value = true
  try {
    const filters: SearchFilter[] = []
    
    if (filtroTrabajador.value) {
      filters.push({ field: 'trabajador', operator: 'eq', value: filtroTrabajador.value })
    }
    if (filtroReporte.value) {
      filters.push({ field: 'reporte', operator: 'eq', value: filtroReporte.value })
    }

    const response = await TrabajadorReporteService.buscarAsignaciones({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters
    })

    // La respuesta puede estar en data.data o directamente en data
    let asignacionesData = []
    if (response.data && Array.isArray(response.data.data)) {
      asignacionesData = response.data.data
    } else if (Array.isArray(response.data)) {
      asignacionesData = response.data
    } else {
      asignacionesData = []
    }

    asignaciones.value = asignacionesData
    totalElementos.value = response.data.totalElements || asignacionesData.length || 0
    
    console.log('Asignaciones cargadas:', asignaciones.value)
    console.log('Trabajadores:', trabajadores.value)
    console.log('Reportes:', reportes.value)
  } catch (error) {
    console.error('Error al cargar asignaciones:', error)
    asignaciones.value = []
    totalElementos.value = 0
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarAsignaciones()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarAsignaciones()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarAsignaciones()
}

// Modales
const abrirModalAsignar = () => {
  mostrarModalAsignar.value = true
}

const cerrarModalAsignar = () => {
  mostrarModalAsignar.value = false
}

const cerrarModalEditar = () => {
  mostrarModalEditar.value = false
  asignacionEditando.value = null
}

const editarAsignacion = (asignacion: TrabajadorReporte) => {
  asignacionEditando.value = { ...asignacion }
  mostrarModalEditar.value = true
}

const confirmarEliminar = async (asignacion: TrabajadorReporte) => {
  // Build a display name using the trabajador info
  const trabajadorNombre = obtenerNombreTrabajador(asignacion.trabajador)
  const confirmed = await confirmDialog.delete(trabajadorNombre || asignacion.id)

  if (confirmed) {
    try {
      await TrabajadorReporteService.eliminarAsignacion(asignacion.id!)
      notify.success('Asignacion eliminada', 'La asignacion fue eliminada correctamente')
      cargarAsignaciones()
    } catch (error) {
      console.error('Error al eliminar:', error)
      const err = error as AxiosError<{ message: string }>
      notify.error('Error', err.response?.data?.message || 'Error al eliminar la asignacion')
    }
  }
}

const handleAsignacionCreada = () => {
  cerrarModalAsignar()
  paginaActual.value = 0
  cargarAsignaciones()
}

const handleAsignacionActualizada = () => {
  cerrarModalEditar()
  cargarAsignaciones()
}

// Lifecycle
onMounted(() => {
  cargarTrabajadores()
  cargarReportes()
  // Esperar a que se carguen los datos relacionados antes de cargar asignaciones
  setTimeout(() => {
    cargarAsignaciones()
  }, 500)
})

// Watchers
watch([filtroTrabajador, filtroReporte], () => {
  paginaActual.value = 0
  cargarAsignaciones()
})
</script>

<style scoped>
.trabajador-reporte-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2em;
  font-weight: 700;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  min-width: 180px;
  background: #fff;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #9b59b6;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #9b59b6;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-buscar {
  background-color: #9b59b6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-buscar:hover {
  background-color: #8e44ad;
  transform: translateY(-2px);
}

.btn-crear {
  background-color: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-crear:hover {
  background-color: #219a52;
  transform: translateY(-2px);
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.asignacion-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.asignacion-table th, .asignacion-table td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.asignacion-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.asignacion-table tr:nth-child(even) {
  background-color: #fafafa;
}

.asignacion-table tr:hover {
  background-color: #f5f0f9;
}

.subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
  font-weight: 400;
}

.norma-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e8eaf6;
  color: #3f51b5;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.horas-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.acciones {
  display: flex;
  gap: 5px;
}

.acciones button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-editar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.95em;
}

.pagination-info .separator {
  color: #ccc;
}

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 5px;
  cursor: pointer;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
  color: #2c3e50;
}

.btn-pag {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-pag:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #bbb;
}

.btn-pag:disabled {
  background: #f5f5f5;
  color: #aaa;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-width: 550px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-asignar {
  max-width: 550px;
}

.modal-small {
  max-width: 400px;
  text-align: center;
}

.modal-small h3 {
  margin-top: 0;
  color: #e74c3c;
}

.warning-text {
  color: #666;
  font-size: 0.9em;
  margin-top: 10px;
  line-height: 1.6;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  line-height: 1;
}

.close:hover {
  color: #333;
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
  }

  .search-filters {
    flex-direction: column;
  }

  .filter-select {
    min-width: 100%;
  }

  .search-input {
    min-width: 100%;
  }

  .button-group {
    width: 100%;
  }

  .button-group button {
    flex: 1;
  }

  .asignacion-table {
    font-size: 0.85em;
  }

  .asignacion-table th,
  .asignacion-table td {
    padding: 8px 10px;
  }

  .acciones {
    flex-direction: column;
    gap: 3px;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-info {
    justify-content: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style>