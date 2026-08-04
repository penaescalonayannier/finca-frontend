<!-- src/components/FincaList.vue -->

<template>
  <div class="finca-list">
    <h2>Gestión de Fincas</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por código, nombre o descripción..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nueva Finca</button>
      <button @click="mostrarModalImportar = true" class="btn-importar">Importar CSV/Excel</button>
      <button v-if="fincasSeleccionadas.length > 0" @click="exportarFincas" class="btn-exportar">
        Exportar ({{ fincasSeleccionadas.length }})
      </button>
    </div>

    <div v-if="isLoading" class="loading">Cargando fincas...</div>

    <table v-else class="finca-table">
      <thead>
        <tr>
          <th class="checkbox-col">
            <input
              type="checkbox"
              :checked="todosSeleccionados"
              @change="toggleSeleccionarTodos"
              class="checkbox-header"
            />
          </th>
          <th>Código</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="fincas.length === 0">
          <td colspan="5" class="no-data">No se encontraron fincas</td>
        </tr>
        <tr v-for="finca in fincas" :key="finca.id">
          <td class="checkbox-col">
            <input
              type="checkbox"
              :checked="estaFincaSeleccionada(finca.id)"
              @change="toggleSeleccionar(finca)"
              class="checkbox-row"
            />
          </td>
          <td><strong>{{ finca.code }}</strong></td>
          <td>{{ finca.name }}</td>
          <td class="description-cell">{{ finca.description || '-' }}</td>
          <td class="acciones">
            <button @click="verFinca(finca)" class="btn-ver">👁️ Ver</button>
            <button @click="editarFinca(finca)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(finca)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && fincas.length > 0" class="pagination">
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
        <CrearFinca @created="handleFincaCreada" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearFinca
          :finca="fincaEditando"
          @updated="handleFincaActualizada"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="mostrarModalDetalle" class="modal">
      <div class="modal-content modal-detalle">
        <DetalleFinca
          :finca-id="fincaDetalleId!"
          @close="mostrarModalDetalle = false"
          @edit="editarDesdeDetalle"
        />
      </div>
    </div>

    <!-- Modal Importar -->
    <div v-if="mostrarModalImportar" class="modal">
      <div class="modal-content modal-importar">
        <span class="close" @click="cerrarModalImportar">&times;</span>
        <h3>Importar Fincas</h3>

        <div class="import-container">
          <div class="file-drop-zone" :class="{ 'drag-over': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon">🌾</div>
            <p>Arrastre un archivo o</p>
            <input type="file" ref="fileInput" @change="handleFileChange" accept=".csv,.xlsx,.xls" class="file-input-hidden" id="file-import" />
            <label for="file-import" class="btn-seleccionar">Seleccionar Archivo</label>
          </div>

          <div v-if="selectedFile" class="file-info">
            <span class="file-name">{{ selectedFile.name }}</span>
            <button @click="limpiarArchivo" class="btn-remove">&times;</button>
          </div>

          <button @click="importarArchivo" :disabled="!selectedFile || isImportando" class="btn-importar-archivo">
            {{ isImportando ? 'Importando...' : 'Importar' }}
          </button>

          <div v-if="mensajeImport" :class="['message', mensajeImportTipo]">
            {{ mensajeImport }}
          </div>
        </div>

        <div class="instrucciones">
          <p><strong>Formatos:</strong> .csv, .xlsx, .xls</p>
          <p><strong>Columnas:</strong> Código, Nombre, Descripción</p>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminar -->
    <div v-if="mostrarModalEliminar" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Eliminación</h3>
        <p>¿Eliminar la finca <strong>{{ fincaEliminar?.name }}</strong>?</p>
        <p class="warning-text">Código: {{ fincaEliminar?.code }}</p>
        <div class="modal-buttons">
          <button @click="eliminarFinca" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminar = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FincaService from '@/services/FincaService'
import CrearFinca from './CrearFinca.vue'
import DetalleFinca from './DetalleFinca.vue'
import type { Finca } from '@/types/Finca'
import type { SearchFilter } from '@/types/EstadoCuenta'

const fincas = ref<Finca[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)
const fincasSeleccionadas = ref<string[]>([])
const isExportando = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const mostrarModalImportar = ref(false)
const mostrarModalDetalle = ref(false)
const fincaEditando = ref<Finca | null>(null)
const fincaEliminar = ref<Finca | null>(null)
const fincaDetalleId = ref<string | null>(null)

// Importar
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImportando = ref(false)
const isDragging = ref(false)
const mensajeImport = ref('')
const mensajeImportTipo = ref<'info' | 'success' | 'error'>('info')

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const todosSeleccionados = computed(() => {
  return fincas.value.length > 0 && fincas.value.every(f => estaFincaSeleccionada(f.id))
})

const cargarFincas = async () => {
  isLoading.value = true
  fincas.value = []
  try {
    const filters: SearchFilter[] = []
    const response = await FincaService.buscarFincas({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
    })

    const data = response.data as Record<string, unknown>
    
    if (data.data && Array.isArray(data.data)) {
      fincas.value = (data.data as Finca[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      fincas.value = (data.content as Finca[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      fincas.value = data as Finca[]
      totalElementos.value = fincas.value.length
    } else {
      fincas.value = []
      totalElementos.value = 0
    }
  } catch (error) {
    console.error('Error al cargar fincas:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarFincas()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarFincas()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarFincas()
}

const verFinca = (finca: Finca) => {
  if (finca.id) {
    fincaDetalleId.value = finca.id
    mostrarModalDetalle.value = true
  }
}

const editarDesdeDetalle = (finca: Finca) => {
  fincaEditando.value = { ...finca }
  mostrarModalEditar.value = true
}

const editarFinca = (finca: Finca) => {
  fincaEditando.value = { ...finca }
  mostrarModalEditar.value = true
}

const confirmarEliminar = (finca: Finca) => {
  fincaEliminar.value = finca
  mostrarModalEliminar.value = true
}

const eliminarFinca = async () => {
  if (!fincaEliminar.value?.id) return
  try {
    await FincaService.eliminarFinca(fincaEliminar.value.id)
    mostrarModalEliminar.value = false
    fincaEliminar.value = null
    cargarFincas()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alert('Error al eliminar la finca')
  }
}

const handleFincaCreada = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  cargarFincas()
}

const handleFincaActualizada = () => {
  mostrarModalEditar.value = false
  cargarFincas()
}

// Funciones de importación
const handleFileChange = (event: Event) => {
  mensajeImport.value = ''
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  validarArchivo(file)
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  validarArchivo(file)
}

const validarArchivo = (file: File | undefined) => {
  if (!file) return
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.csv', '.xlsx', '.xls'].includes(ext)) {
    selectedFile.value = file
  } else {
    alert('Formato no válido. Use CSV o Excel.')
  }
}

const limpiarArchivo = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const cerrarModalImportar = () => {
  mostrarModalImportar.value = false
  limpiarArchivo()
  mensajeImport.value = ''
}

const importarArchivo = async () => {
  if (!selectedFile.value) return
  isImportando.value = true
  mensajeImport.value = 'Importando...'
  mensajeImportTipo.value = 'info'

  try {
    const response = await FincaService.importarCsv(selectedFile.value)
    mensajeImport.value = response.data.message || 'Importación exitosa'
    mensajeImportTipo.value = 'success'
    limpiarArchivo()
    cargarFincas()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    mensajeImport.value = err.response?.data?.message || 'Error al importar'
    mensajeImportTipo.value = 'error'
  } finally {
    isImportando.value = false
  }
}

// Funciones de selección
const estaFincaSeleccionada = (id: string | undefined): boolean => {
  return id ? fincasSeleccionadas.value.includes(id) : false
}

const toggleSeleccionar = (finca: Finca) => {
  if (!finca.id) return
  const index = fincasSeleccionadas.value.indexOf(finca.id)
  if (index > -1) {
    fincasSeleccionadas.value.splice(index, 1)
  } else {
    fincasSeleccionadas.value.push(finca.id)
  }
}

const toggleSeleccionarTodos = () => {
  if (todosSeleccionados.value) {
    fincasSeleccionadas.value = []
  } else {
    fincasSeleccionadas.value = fincas.value
      .map(f => f.id)
      .filter((id): id is string => !!id)
  }
}

const exportarFincas = async () => {
  if (fincasSeleccionadas.value.length === 0) {
    alert('Selecciona al menos una finca')
    return
  }

  isExportando.value = true
  try {
    const response = await FincaService.exportarFincas(fincasSeleccionadas.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fincas_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)

    fincasSeleccionadas.value = []
  } catch (error) {
    console.error('Error al exportar:', error)
    alert('Error al exportar las fincas')
  } finally {
    isExportando.value = false
  }
}

onMounted(() => {
  cargarFincas()
})
</script>

<style scoped>
.finca-list { 
  padding: 20px; 
  max-width: 1200px;
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
  border-color: #27ae60;
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

.btn-buscar { background-color: #27ae60; color: white; }
.btn-crear { background-color: #2ecc71; color: white; }
.btn-importar { background-color: #9b59b6; color: white; }

.btn-buscar, .btn-crear, .btn-importar, .btn-exportar {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.btn-buscar:hover { 
  background-color: #219a52; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}
.btn-crear:hover { 
  background-color: #27ae60; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}
.btn-importar:hover { 
  background-color: #8e44ad; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-exportar { 
  background-color: #e67e22; 
  color: white; 
}
.btn-exportar:hover { 
  background-color: #d35400; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.finca-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.finca-table th, .finca-table td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.finca-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.finca-table tr:nth-child(even) { background-color: #fafafa; }
.finca-table tr:hover { background-color: #f0f9f0; }

.checkbox-col {
  width: 40px;
  text-align: center;
  padding: 8px;
}

.checkbox-header, .checkbox-row {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #27ae60;
}

.description-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acciones {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.acciones button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
}

.btn-ver {
  background-color: #1abc9c;
  color: white;
}

.btn-ver:hover {
  background-color: #16a085;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-editar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar:hover {
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

.pagination-info .separator { color: #ccc; }

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
  left: 0; top: 0;
  width: 100%; height: 100%;
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

.modal-importar { max-width: 450px; }
.modal-small { max-width: 350px; text-align: center; }
.modal-small h3 { margin-top: 0; color: #e74c3c; }
.warning-text { color: #666; font-size: 0.9em; margin-top: 5px; }

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
  top: 10px; right: 15px;
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

.import-container { margin: 20px 0; }

.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.file-drop-zone:hover, .file-drop-zone.drag-over {
  border-color: #9b59b6;
  background-color: #f3e5f5;
}

.drop-icon { font-size: 2.5em; margin-bottom: 10px; }
.file-input-hidden { display: none; }

.btn-seleccionar {
  display: inline-block;
  background-color: #9b59b6;
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-seleccionar:hover { 
  background-color: #8e44ad;
  transform: translateY(-2px);
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
  margin-top: 10px;
}

.file-name { font-weight: 500; color: #2e7d32; }
.btn-remove { 
  background: none; 
  border: none; 
  font-size: 1.3em; 
  color: #999; 
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover { color: #e74c3c; }

.btn-importar-archivo {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-importar-archivo:hover:not(:disabled) { 
  background-color: #219a52;
  transform: translateY(-2px);
}

.btn-importar-archivo:disabled { 
  background-color: #bdc3c7; 
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.info { background-color: #e3f2fd; color: #1976d2; }
.success { background-color: #e8f5e9; color: #388e3c; }
.error { background-color: #ffebee; color: #d32f2f; }

.instrucciones {
  margin-top: 15px;
  padding: 12px 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 0.85em;
  color: #666;
}

.instrucciones p { margin: 5px 0; }

@media (max-width: 768px) {
  .finca-list {
    padding: 10px;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .finca-table {
    font-size: 0.85em;
  }
  
  .finca-table th, 
  .finca-table td {
    padding: 8px 10px;
  }
  
  .description-cell {
    max-width: 100px;
  }
  
  .acciones {
    flex-direction: column;
    gap: 3px;
  }
  
  .acciones button {
    padding: 4px 8px;
    font-size: 0.75em;
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