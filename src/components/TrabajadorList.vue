<!-- src/components/TrabajadorList.vue -->

<template>
  <div class="trabajador-list">
    <h2>Gestión de Trabajadores</h2>

    <!-- Información de Estado -->
    <div class="estado-info">
      <div class="info-card">
        <div class="info-label">Total Trabajadores</div>
        <div class="info-value">{{ totalElementos }}</div>
      </div>
      <div class="info-card activos">
        <div class="info-label">Activos</div>
        <div class="info-value">{{ totalActivos }}</div>
      </div>
      <div class="info-card inactivos">
        <div class="info-label">Inactivos</div>
        <div class="info-value">{{ totalInactivos }}</div>
      </div>
      <div class="info-porcentaje">
        <span class="pct-label">{{ porcentajeActivos }}% activos</span>
      </div>
    </div>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por nombre, RUC o cuenta..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />

      <select v-model="filtroEstado" @change="buscarConReset" class="filter-select">
        <option value="activos">Solo Activos</option>
        <option value="inactivos">Solo Inactivos</option>
        <option value="">Todos</option>
      </select>

      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Trabajador</button>
      <button @click="mostrarModalImportar = true" class="btn-importar">Importar CSV/Excel</button>
      <button v-if="trabajadoresSeleccionados.length > 0" @click="exportarTrabajadores" class="btn-exportar">
        Exportar ({{ trabajadoresSeleccionados.length }})
      </button>
    </div>

    <div v-if="isLoading" class="loading">Cargando trabajadores...</div>

    <table v-else class="trabajador-table">
      <thead>
        <tr>
          <th class="numero-col">#</th>
          <th class="checkbox-col">
            <input
              type="checkbox"
              :checked="todosSeleccionados"
              @change="toggleSeleccionarTodos"
              class="checkbox-header"
            />
          </th>
          <th>RUC</th>
          <th>Nombre</th>
          <th>Cuenta</th>
          <th>Cargo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="trabajadores.length === 0">
          <td colspan="8" class="no-data">No se encontraron trabajadores</td>
        </tr>
        <tr v-for="(trabajador, index) in trabajadores" :key="trabajador.id" :class="{ 'inactivo': !trabajador.activo }">
          <td class="numero-col">{{ (paginaActual * tamanoPagina) + (index + 1) }}</td>
          <td class="checkbox-col">
            <input
              type="checkbox"
              :checked="estaTrabajadorSeleccionado(trabajador.id)"
              @change="toggleSeleccionar(trabajador)"
              class="checkbox-row"
            />
          </td>
          <td>{{ trabajador.ruc }}</td>
          <td>{{ trabajador.nombre }}</td>
          <td>{{ trabajador.cuenta }}</td>
          <td>
            <span class="cargo-badge">{{ trabajador.cargoName || '-' }}</span>
          </td>
          <td>
            <span :class="['estado-badge', trabajador.activo ? 'activo' : 'inactivo']">
              {{ trabajador.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="acciones">
            <button @click="editarTrabajador(trabajador)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(trabajador)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && trabajadores.length > 0" class="pagination">
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
        <CrearTrabajador @created="handleTrabajadorCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearTrabajador
          :trabajador="trabajadorEditando"
          @updated="handleTrabajadorActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Importar -->
    <div v-if="mostrarModalImportar" class="modal">
      <div class="modal-content modal-importar">
        <span class="close" @click="cerrarModalImportar">&times;</span>
        <h3>Importar Trabajadores</h3>

        <div class="import-container">
          <div class="file-drop-zone" :class="{ 'drag-over': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon">📋</div>
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
          <p><strong>Columnas:</strong> RUC, Nombre, Cuenta, Cargo</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TrabajadorService from '@/services/TrabajadorService'
import CrearTrabajador from './CrearTrabajador.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Trabajador } from '@/types/Trabajador'
import type { SearchFilter } from '@/types/EstadoCuenta'

const trabajadores = ref<Trabajador[]>([])
const searchQuery = ref('')
const filtroEstado = ref('activos')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const totalActivos = ref(0)
const totalInactivos = ref(0)
const isLoading = ref(false)
const trabajadoresSeleccionados = ref<string[]>([])
const isExportando = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalImportar = ref(false)
const trabajadorEditando = ref<Trabajador | null>(null)

// Importar
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImportando = ref(false)
const isDragging = ref(false)
const mensajeImport = ref('')
const mensajeImportTipo = ref<'info' | 'success' | 'error'>('info')

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const porcentajeActivos = computed(() => {
  if (totalElementos.value === 0) return 0
  return Math.round((totalActivos.value / totalElementos.value) * 100)
})

const todosSeleccionados = computed(() => {
  return trabajadores.value.length > 0 && trabajadores.value.every(t => estaTrabajadorSeleccionado(t.id))
})

const cargarTrabajadores = async () => {
  isLoading.value = true
  trabajadores.value = []
  try {
    const filters: SearchFilter[] = []

    // Agregar filtros de búsqueda por texto
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'nombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'ruc',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    // Agregar filtro por estado si está seleccionado
    if (filtroEstado.value) {
      filters.push({
        key: 'activo',
        operator: 'EQUALS',
        value: filtroEstado.value === 'activos' ? 'true' : 'false',
        logicalOperation: 'AND'
      })
    }

    const response = await TrabajadorService.buscarTrabajadores({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
    })

    const data = response.data as Record<string, unknown>

    if (data.data && Array.isArray(data.data)) {
      trabajadores.value = (data.data as Trabajador[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      trabajadores.value = (data.content as Trabajador[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      trabajadores.value = data as Trabajador[]
      totalElementos.value = trabajadores.value.length
    } else {
      trabajadores.value = []
      totalElementos.value = 0
    }

    // Cargar estadísticas totales
    await cargarEstadisticas()
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  } finally {
    isLoading.value = false
  }
}

const cargarEstadisticas = async () => {
  try {
    // Obtener totales sin filtro para mostrar las estadísticas globales
    const response = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 1000,
      query: searchQuery.value,
      filter: [],
    })

    const data = response.data as Record<string, unknown>
    let todosTrabajadores: Trabajador[] = []

    if (data.data && Array.isArray(data.data)) {
      todosTrabajadores = (data.data as Trabajador[]) || []
    } else if (data.content && Array.isArray(data.content)) {
      todosTrabajadores = (data.content as Trabajador[]) || []
    } else if (Array.isArray(data)) {
      todosTrabajadores = data as Trabajador[]
    }

    totalActivos.value = todosTrabajadores.filter(t => t.activo === true).length
    totalInactivos.value = todosTrabajadores.filter(t => t.activo === false).length
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarTrabajadores()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarTrabajadores()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarTrabajadores()
}

const editarTrabajador = async (trabajador: Trabajador) => {
  if (!trabajador.id) return

  try {
    // Obtener los datos completos del trabajador incluyendo cargoId
    console.log('Obteniendo datos completos del trabajador:', trabajador.id)
    const response = await TrabajadorService.obtenerTrabajadorPorId(trabajador.id)
    trabajadorEditando.value = response.data
    console.log('Trabajador cargado para editar:', trabajadorEditando.value)
    mostrarModalEditar.value = true
  } catch (error) {
    console.error('Error al cargar el trabajador para editar:', error)
    notify.error('Error', 'No se pudo cargar el trabajador')
  }
}

const confirmarEliminar = async (trabajador: Trabajador) => {
  const confirmed = await confirmDialog.delete(trabajador.nombre)

  if (confirmed) {
    try {
      await TrabajadorService.eliminarTrabajador(trabajador.id!)
      notify.success('Trabajador eliminado', 'El trabajador fue eliminado correctamente')
      cargarTrabajadores()
    } catch (error) {
      console.error('Error al eliminar:', error)
      notify.error('Error', 'No se pudo eliminar el trabajador')
    }
  }
}

const handleTrabajadorCreado = () => {
  mostrarModalCrear.value = false
  notify.success('Trabajador creado', 'El trabajador fue registrado correctamente')
  paginaActual.value = 0
  cargarTrabajadores()
}

const handleTrabajadorActualizado = () => {
  mostrarModalEditar.value = false
  notify.success('Trabajador actualizado', 'Los datos fueron guardados correctamente')
  cargarTrabajadores()
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
    notify.warning('Formato inválido', 'Use archivos CSV o Excel (.csv, .xlsx, .xls)')
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
    const response = await TrabajadorService.importarCsv(selectedFile.value)
    mensajeImport.value = response.data.message || 'Importación exitosa'
    mensajeImportTipo.value = 'success'
    limpiarArchivo()
    cargarTrabajadores()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    mensajeImport.value = err.response?.data?.message || 'Error al importar'
    mensajeImportTipo.value = 'error'
  } finally {
    isImportando.value = false
  }
}

const estaTrabajadorSeleccionado = (id: string | undefined): boolean => {
  return id ? trabajadoresSeleccionados.value.includes(id) : false
}

const toggleSeleccionar = (trabajador: Trabajador) => {
  if (!trabajador.id) return
  const index = trabajadoresSeleccionados.value.indexOf(trabajador.id)
  if (index > -1) {
    trabajadoresSeleccionados.value.splice(index, 1)
  } else {
    trabajadoresSeleccionados.value.push(trabajador.id)
  }
}

const toggleSeleccionarTodos = () => {
  if (todosSeleccionados.value) {
    trabajadoresSeleccionados.value = []
  } else {
    trabajadoresSeleccionados.value = trabajadores.value
      .map(t => t.id)
      .filter((id): id is string => !!id)
  }
}

const exportarTrabajadores = async () => {
  if (trabajadoresSeleccionados.value.length === 0) {
    notify.warning('Selección vacía', 'Selecciona al menos un trabajador')
    return
  }

  isExportando.value = true
  try {
    const response = await TrabajadorService.exportarTrabajadores(trabajadoresSeleccionados.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `trabajadores_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)

    trabajadoresSeleccionados.value = []
  } catch (error) {
    console.error('Error al exportar:', error)
    notify.error('Error', 'No se pudo exportar los trabajadores')
  } finally {
    isExportando.value = false
  }
}

onMounted(() => {
  cargarTrabajadores()
})
</script>

<style scoped>
.trabajador-list { padding: 20px; }

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
}

/* Información de Estado */
.estado-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3498db;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-card.activos {
  border-left-color: #27ae60;
}

.info-card.inactivos {
  border-left-color: #e74c3c;
}

.info-label {
  font-size: 0.85em;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.info-value {
  font-size: 2em;
  font-weight: 700;
  color: #2c3e50;
}

.info-porcentaje {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #f39c12;
}

.pct-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1em;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 0.95em;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-buscar { background-color: #3498db; color: white; }
.btn-crear { background-color: #27ae60; color: white; }
.btn-importar { background-color: #9b59b6; color: white; }

.btn-buscar, .btn-crear, .btn-importar, .btn-exportar {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-buscar:hover { background-color: #2980b9; }
.btn-crear:hover { background-color: #219a52; }
.btn-importar:hover { background-color: #8e44ad; }

.btn-exportar { background-color: #e67e22; color: white; }
.btn-exportar:hover { background-color: #d35400; }

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.trabajador-table {
  width: 100%;
  border-collapse: collapse;
}

.trabajador-table th, .trabajador-table td {
  border: 1px solid #eee;
  padding: 12px;
  text-align: left;
}

.trabajador-table th { background-color: #f5f5f5; }
.trabajador-table tr:nth-child(even) { background-color: #fafafa; }

.numero-col {
  width: 50px;
  text-align: center;
  font-weight: 600;
  color: #7f8c8d;
}

.checkbox-col {
  width: 40px;
  text-align: center;
  padding: 8px;
}

.checkbox-header, .checkbox-row {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.cargo-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e8eaf6;
  color: #3f51b5;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.estado-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.estado-badge.activo {
  background: #e8f5e9;
  color: #2e7d32;
}

.estado-badge.inactivo {
  background: #ffebee;
  color: #c62828;
}

.trabajador-table tr.inactivo {
  opacity: 0.7;
  background-color: #f5f5f5;
}

.acciones button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-editar { background-color: #3498db; color: white; }
.btn-eliminar { background-color: #e74c3c; color: white; }
.btn-editar:hover { background-color: #2980b9; }
.btn-eliminar:hover { background-color: #c0392b; }

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info { display: flex; align-items: center; gap: 10px; color: #666; }
.pagination-info .separator { color: #ccc; }
.select-size { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin-left: 5px; }
.pagination-controls { display: flex; align-items: center; gap: 10px; }
.page-indicator { padding: 0 15px; font-weight: 500; }

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.btn-pag:hover:not(:disabled) { background-color: #e9ecef; }
.btn-pag:disabled { background-color: #e9ecef; color: #aaa; cursor: not-allowed; }

.modal {
  position: fixed;
  z-index: 1000;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  position: relative;
  width: 90%;
  max-width: 500px;
}

.modal-importar { max-width: 450px; }
.modal-small { max-width: 350px; text-align: center; }
.modal-small h3 { margin-top: 0; color: #e74c3c; }

.modal-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
.btn-cancelar { background-color: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-cancelar:hover { background-color: #7f8c8d; }

.close {
  position: absolute;
  top: 10px; right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
.close:hover { color: #333; }

.import-container { margin: 20px 0; }

.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s;
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
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-seleccionar:hover { background-color: #8e44ad; }

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  margin-top: 10px;
}

.file-name { font-weight: 500; color: #2e7d32; }
.btn-remove { background: none; border: none; font-size: 1.3em; color: #999; cursor: pointer; }
.btn-remove:hover { color: #e74c3c; }

.btn-importar-archivo {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-importar-archivo:hover:not(:disabled) { background-color: #219a52; }
.btn-importar-archivo:disabled { background-color: #bdc3c7; cursor: not-allowed; }

.message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}
.info { background-color: #e3f2fd; color: #1976d2; }
.success { background-color: #e8f5e9; color: #388e3c; }
.error { background-color: #ffebee; color: #d32f2f; }

.instrucciones {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.85em;
  color: #666;
}
.instrucciones p { margin: 5px 0; }

@media (max-width: 768px) {
  .trabajador-list { padding: 10px; }

  .estado-info {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }

  .trabajador-table { font-size: 0.85em; }
  .trabajador-table th, .trabajador-table td { padding: 8px 10px; }
  .acciones button { padding: 4px 8px; font-size: 0.75em; }
  .pagination { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-info { justify-content: center; }
  .pagination-controls { justify-content: center; }
  .modal-content { width: 95%; padding: 20px; }

  .info-value {
    font-size: 1.5em;
  }

  .pct-label {
    font-size: 0.95em;
  }
}
</style>