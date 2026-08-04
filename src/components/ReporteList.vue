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
              @click="verReporte(reporte)" 
              class="btn-ver" 
              title="Ver detalle"
            >
              👁️
            </button>
            <button 
              @click="generarPdf(reporte)" 
              class="btn-pdf" 
              :data-pdf-id="reporte.id"
              title="Generar PDF"
              :disabled="generandoPdf === reporte.id"
            >
              {{ generandoPdf === reporte.id ? '⏳' : '📄' }}
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

    <!-- Modal Confirmar Eliminar -->
    <div v-if="mostrarModalEliminar" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Eliminación</h3>
        <p>¿Eliminar el reporte <strong>{{ reporteEliminar?.codigo }}</strong>?</p>
        <p class="warning-text">Bloque: {{ reporteEliminar?.bloque }} - Campo: {{ reporteEliminar?.campo }}</p>
        <div class="modal-buttons">
          <button @click="eliminarReporte" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminar = false" class="btn-cancelar">Cancelar</button>
        </div>
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
import CargaMasivaWizard from './CargaMasivaWizard.vue'
import type { Reporte } from '@/types/Reporte'
import type { SearchFilter } from '@/types/EstadoCuenta'

const reportes = ref<Reporte[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)
const generandoPdf = ref<string | null>(null)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const mostrarModalDetalle = ref(false)
const mostrarModalCargaMasiva = ref(false)
const reporteEditando = ref<Reporte | null>(null)
const reporteEliminar = ref<Reporte | null>(null)
const reporteDetalleId = ref<string | null>(null)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const cargarReportes = async () => {
  isLoading.value = true
  reportes.value = []
  try {
    const filters: SearchFilter[] = []
    const response = await ReporteService.buscarReportes({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
      sortBy: 'id',
      sortType: 'DES'
    })

    const data = response.data as Record<string, unknown>
    
    if (data.data && Array.isArray(data.data)) {
      reportes.value = (data.data as Reporte[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      reportes.value = (data.content as Reporte[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      reportes.value = data as Reporte[]
      totalElementos.value = reportes.value.length
    } else {
      reportes.value = []
      totalElementos.value = 0
    }
  } catch (error) {
    console.error('Error al cargar reportes:', error)
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

const editarDesdeDetalle = (reporte: Reporte) => {
  reporteEditando.value = { ...reporte }
  mostrarModalEditar.value = true
}

const editarReporte = (reporte: Reporte) => {
  reporteEditando.value = { ...reporte }
  mostrarModalEditar.value = true
}

const confirmarEliminar = (reporte: Reporte) => {
  reporteEliminar.value = reporte
  mostrarModalEliminar.value = true
}

const eliminarReporte = async () => {
  if (!reporteEliminar.value?.id) return
  try {
    await ReporteService.eliminarReporte(reporteEliminar.value.id)
    mostrarModalEliminar.value = false
    reporteEliminar.value = null
    cargarReportes()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alert('Error al eliminar el reporte')
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

// ==================== GENERAR PDF ====================
const generarPdf = async (reporte: Reporte) => {
  if (!reporte.id) {
    alert('El reporte no tiene un ID válido')
    return
  }

  // Marcar que este reporte está generando PDF
  generandoPdf.value = reporte.id

  try {
    console.log('📄 Generando PDF para reporte:', reporte.id)
    console.log('📄 Código del reporte:', reporte.codigo)
    
    // Obtener el blob directamente
    const blob = await ReporteService.generarPdfReporte(reporte.id)
    
    console.log('📄 Blob recibido:', blob)
    console.log('📄 Tamaño del blob:', blob.size)
    console.log('📄 Tipo del blob:', blob.type)
    
    // Verificar que el blob tenga datos
    if (!blob || blob.size === 0) {
      throw new Error('El PDF generado está vacío')
    }
    
    // Verificar que sea un PDF
    if (blob.type && blob.type !== 'application/pdf') {
      // Si no es PDF, intentar leer como texto para ver el error
      const text = await blob.text()
      console.error('❌ Respuesta no PDF:', text)
      throw new Error('El servidor no devolvió un PDF válido')
    }
    
    // Crear un blob y descargar el archivo
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_${reporte.codigo || reporte.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ PDF generado y descargado correctamente')
  } catch (error) {
    console.error('❌ Error detallado al generar PDF:', error)
    
    let mensajeError = 'Error al generar el PDF del reporte'
    
    if (error instanceof Error) {
      mensajeError = error.message
    }
    
    // Mostrar el error en un alert más detallado
    alert(`❌ Error al generar PDF:\n\n${mensajeError}\n\nRevisa la consola para más detalles.`)
  } finally {
    // Limpiar el estado de generación
    generandoPdf.value = null
  }
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

.btn-pdf {
  background-color: #e74c3c;
  color: white;
}

.btn-pdf:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

.modal-small {
  max-width: 400px;
  text-align: center;
}

.modal-small h3 {
  margin-top: 0;
  color: #e74c3c;
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