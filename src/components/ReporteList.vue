<!-- src/components/ReporteList.vue -->

<template>
  <div class="reporte-list">
    <h2>Gestión de Reportes</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por código, bloque, campo..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <select v-model="filtroYear" class="filter-select" @change="buscarConReset">
        <option value="">Todos los años</option>
        <option v-for="year in yearsDisponibles" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="filtroMes" class="filter-select" @change="buscarConReset">
        <option value="">Todos los meses</option>
        <option v-for="mes in meses" :key="mes" :value="mes">{{ mes }}</option>
      </select>
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Reporte</button>
      <button @click="mostrarModalCargaMasiva = true" class="btn-carga-masiva">⚡ Carga Masiva</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando reportes...</div>

    <table v-else class="reporte-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Bloque</th>
          <th>Campo</th>
          <th>Área</th>
          <th>Norma</th>
          <th>Fecha</th>
          <th>Mes/Año</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="reportes.length === 0">
          <td colspan="8" class="no-data">No se encontraron reportes</td>
        </tr>
        <tr v-for="reporte in reportes" :key="reporte.id">
          <td><strong>{{ reporte.codigo }}</strong></td>
          <td>{{ reporte.bloque }}</td>
          <td>{{ reporte.campo }}</td>
          <td>{{ reporte.area }}</td>
          <td>{{ reporte.norma }}</td>
          <td>{{ formatDate(reporte.fecha) }}</td>
          <td>{{ reporte.mes }} / {{ reporte.year }}</td>
          <td class="acciones">
            <button
              @click="verReporteExcel(reporte)"
              class="btn-ver-excel"
              title="Vista Excel"
            >
              📊
            </button>
            <button
              @click="verReporte(reporte)"
              class="btn-ver"
              title="Ver detalle"
            >
              👁️
            </button>
            <button
              @click="editarReporte(reporte)" 
              class="btn-editar" 
              title="Editar"
            >
              ✏️
            </button>
            <button 
              @click="confirmarEliminar(reporte)" 
              class="btn-eliminar" 
              title="Eliminar"
            >
              🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && reportes.length > 0" class="pagination">
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

    <!-- Modal Crear/Editar -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearReporte @created="handleReporteCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearReporte
          :reporte="reporteEditando"
          @updated="handleReporteActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="mostrarModalDetalle" class="modal">
      <div class="modal-content modal-detalle">
        <DetalleReporte
          :reporte-id="reporteDetalleId!"
          @close="mostrarModalDetalle = false"
          @edit="editarDesdeDetalle"
        />
      </div>
    </div>

    <!-- Modal Detalle Excel -->
    <div v-if="mostrarModalDetalleExcel" class="modal">
      <div class="modal-content modal-excel">
        <DetalleReporteExcel
          :reporte-id="reporteDetalleId!"
          @close="mostrarModalDetalleExcel = false"
        />
      </div>
    </div>

    <!-- Modal Carga Masiva Wizard -->
    <div v-if="mostrarModalCargaMasiva" class="modal modal-wizard">
      <div class="modal-content modal-wizard-content">
        <span class="close" @click="mostrarModalCargaMasiva = false">&times;</span>
        <CargaMasivaWizard @created="handleCargaMasivaCreada" @cancel="mostrarModalCargaMasiva = false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReporteService from '@/services/ReporteService'
import CrearReporte from './CrearReporte.vue'
import DetalleReporte from './DetalleReporte.vue'
import DetalleReporteExcel from './DetalleReporteExcel.vue'
import CargaMasivaWizard from './CargaMasivaWizard.vue'
import type { Reporte } from '@/types/Reporte'
import type { SearchFilter } from '@/types/EstadoCuenta'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'

const reportes = ref<Reporte[]>([])
const searchQuery = ref('')
const filtroYear = ref('')
const filtroMes = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalDetalle = ref(false)
const mostrarModalDetalleExcel = ref(false)
const mostrarModalCargaMasiva = ref(false)
const reporteEditando = ref<Reporte | null>(null)
const reporteDetalleId = ref<string | null>(null)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const yearsDisponibles = computed(() => {
  const actual = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, indice) => String(actual - 5 + indice))
})

const cargarReportes = async () => {
  isLoading.value = true
  reportes.value = []
  try {
    const filters: SearchFilter[] = []

    // Agregar filtros de búsqueda por texto
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'codigo',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'bloque',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({ key: 'campo', operator: 'CONTAINS', value: searchQuery.value.trim(), logicalOperation: 'OR' })
      filters.push({ key: 'area', operator: 'CONTAINS', value: searchQuery.value.trim(), logicalOperation: 'OR' })
    }
    if (filtroYear.value) {
      filters.push({ key: 'year', operator: 'EQUALS', value: filtroYear.value, logicalOperation: 'AND' })
    }
    if (filtroMes.value) {
      filters.push({ key: 'mes', operator: 'EQUALS', value: filtroMes.value, logicalOperation: 'AND' })
    }

    console.log('🔍 [ReporteList] Iniciando carga de reportes...')
    console.log('🔍 [ReporteList] Host actual:', window.location.host)

    const response = await ReporteService.buscarReportes({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
      sortBy: 'codigo',
      sortType: 'DES'
    })

    console.log('📦 [ReporteList] Respuesta completa:', response)
    console.log('📦 [ReporteList] response.data:', response.data)
    console.log('📦 [ReporteList] response.status:', response.status)

    const data = response.data as Record<string, unknown>

    if (data.data && Array.isArray(data.data)) {
      reportes.value = (data.data as Reporte[]) || []
      totalElementos.value = Number(data.totalElements) || 0
      console.log('✅ [ReporteList] Usando data.data:', reportes.value.length, 'reportes')
    } else if (data.content && Array.isArray(data.content)) {
      reportes.value = (data.content as Reporte[]) || []
      totalElementos.value = Number(data.totalElements) || 0
      console.log('✅ [ReporteList] Usando data.content:', reportes.value.length, 'reportes')
    } else if (Array.isArray(data)) {
      reportes.value = data as Reporte[]
      totalElementos.value = reportes.value.length
      console.log('✅ [ReporteList] Usando data como array:', reportes.value.length, 'reportes')
    } else {
      reportes.value = []
      totalElementos.value = 0
      console.warn('⚠️ [ReporteList] Formato de respuesta no reconocido:', data)
    }
  } catch (error) {
    console.error('❌ [ReporteList] Error al cargar reportes:', error)
    notify.error('No se pudieron cargar los reportes', 'Revise la conexión o intente nuevamente.')
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarReportes()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarReportes()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarReportes()
}

const verReporte = (reporte: Reporte) => {
  if (reporte.id) {
    reporteDetalleId.value = reporte.id
    mostrarModalDetalle.value = true
  }
}

const verReporteExcel = (reporte: Reporte) => {
  if (reporte.id) {
    reporteDetalleId.value = reporte.id
    mostrarModalDetalleExcel.value = true
  }
}

const editarDesdeDetalle = (reporte: Reporte) => {
  reporteEditando.value = { ...reporte }
  mostrarModalEditar.value = true
}

const editarReporte = (reporte: Reporte) => {
  reporteEditando.value = { ...reporte }
  mostrarModalEditar.value = true
}

const confirmarEliminar = async (reporte: Reporte) => {
  const confirmed = await confirmDialog.delete(reporte.codigo || reporte.id)

  if (confirmed) {
    try {
      await ReporteService.eliminarReporte(reporte.id!)
      notify.success('Reporte eliminado', 'El reporte fue eliminado correctamente')
      cargarReportes()
    } catch (error) {
      console.error('Error al eliminar:', error)
      notify.error('Error', 'No se pudo eliminar el reporte')
    }
  }
}

const handleReporteCreado = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  cargarReportes()
}

const handleReporteActualizado = () => {
  mostrarModalEditar.value = false
  cargarReportes()
}

const handleCargaMasivaCreada = () => {
  mostrarModalCargaMasiva.value = false
  paginaActual.value = 0
  cargarReportes()
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  cargarReportes()
})
</script>

<style scoped>
.reporte-list {
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
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-buscar {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-buscar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
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
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-carga-masiva {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-carga-masiva:hover {
  background: linear-gradient(135deg, #8e44ad, #7d3c98);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.reporte-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.reporte-table th, .reporte-table td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.reporte-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reporte-table tr:nth-child(even) {
  background-color: #fafafa;
}

.reporte-table tr:hover {
  background-color: #f0f7ff;
}

.acciones {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.acciones button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
  min-width: 32px;
  text-align: center;
}

.acciones button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ver {
  background-color: #1abc9c;
  color: white;
}

.btn-ver:hover:not(:disabled) {
  background-color: #16a085;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
}

.btn-ver-excel {
  background-color: #217346;
  color: white;
}

.btn-ver-excel:hover:not(:disabled) {
  background-color: #1a5c38;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 115, 70, 0.3);
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-editar:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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
  max-width: 600px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-detalle {
  max-width: 650px;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

.modal-detalle .modal-content {
  padding: 0;
  max-width: 650px;
  border-radius: 16px;
}

.modal-excel {
  max-width: calc(100vw - 40px);
  width: auto;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  max-height: 90vh;
}

.modal-small {
  max-width: 400px;
  text-align: center;
}

.modal-small h3 {
  margin-top: 0;
  color: #e74c3c;
}

/* Modal Eliminar */
.modal-eliminar {
  max-width: 380px;
  text-align: center;
  padding: 30px !important;
  border-radius: 16px;
}

.modal-eliminar-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.modal-eliminar h3 {
  margin: 0 0 20px 0;
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
}

.modal-eliminar-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
}

.info-codigo {
  font-size: 1.3em;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 8px;
}

.info-detalle {
  color: #555;
  font-size: 0.95em;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.info-detalle .separador {
  color: #ccc;
}

.info-periodo {
  color: #888;
  font-size: 0.85em;
  margin-top: 5px;
}

.modal-eliminar .warning-text {
  color: #e74c3c;
  font-size: 0.85em;
  margin: 15px 0;
  font-style: italic;
}

.modal-eliminar-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancelar-modal {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #ddd;
  background: #fff;
  color: #666;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancelar-modal:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-confirmar-eliminar {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirmar-eliminar:hover {
  background: #c0392b;
}

.modal-wizard {
  align-items: flex-start;
  padding-top: 50px;
}

.modal-wizard-content {
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 12px;
}

.warning-text {
  color: #666;
  font-size: 0.9em;
  margin-top: 5px;
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
  .reporte-list {
    padding: 10px;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .reporte-table {
    font-size: 0.85em;
  }

  .reporte-table th,
  .reporte-table td {
    padding: 8px 10px;
  }

  .acciones {
    flex-direction: column;
    gap: 3px;
  }

  .acciones button {
    padding: 4px 8px;
    font-size: 0.75em;
    min-width: 28px;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
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

  .modal-detalle {
    max-width: 95%;
    margin: 10px;
  }
}
</style>
