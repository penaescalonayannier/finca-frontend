<!-- src/components/TrabajadorList.vue -->

<template>
  <div class="trabajador-list">
    <h2>Gestión de Trabajadores</h2>

    <!-- Información de Estado -->
    <div class="estado-info">
      <div class="info-card">
        <div class="info-label">Total Trabajadores</div>
        <div class="info-value">{{ totalGlobal }}</div>
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
      <button @click="exportarPdfPorCargo" class="btn-pdf" :disabled="isExportandoPdf">
        {{ isExportandoPdf ? 'Generando...' : 'PDF por Cargo' }}
      </button>
      <button @click="exportarPdfPorGrupo" class="btn-pdf-grupo" :disabled="isExportandoPdfGrupo">
        {{ isExportandoPdfGrupo ? 'Generando...' : 'PDF por Grupo' }}
      </button>
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
          <th>Grupo</th>
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
          <td class="nombre-cell">
            <span class="nombre-principal">{{ trabajador.nombre }}</span>
            <span v-if="trabajador.cargoName" class="cargo-subtexto">{{ trabajador.cargoName }}</span>
          </td>
          <td>{{ trabajador.cuenta }}</td>
          <td>
            <span class="grupo-badge">{{ trabajador.grupoNombre || '-' }}</span>
          </td>
          <td>
            <span :class="['estado-badge', trabajador.activo ? 'activo' : 'inactivo']">
              {{ trabajador.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="acciones">
            <button @click="verDetalles(trabajador)" class="btn-ver">Ver</button>
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

    <!-- Modal Ver Detalles -->
    <div v-if="mostrarModalDetalles" class="modal">
      <div class="modal-content modal-detalles">
        <span class="close" @click="mostrarModalDetalles = false">&times;</span>

        <div v-if="trabajadorDetalles" class="detalles-wrapper">
          <!-- Header con avatar e info principal -->
          <div class="detalles-header">
            <div class="avatar">
              {{ trabajadorDetalles.nombre?.charAt(0)?.toUpperCase() || 'T' }}
            </div>
            <div class="header-info">
              <h3 class="nombre">{{ trabajadorDetalles.nombre }}</h3>
              <span class="ruc">RUC: {{ trabajadorDetalles.ruc }}</span>
              <span :class="['estado-badge-header', trabajadorDetalles.activo ? 'activo' : 'inactivo']">
                {{ trabajadorDetalles.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- Grid de información -->
          <div class="detalles-grid">
            <div class="detalle-card">
              <div class="detalle-icon">💳</div>
              <div class="detalle-info">
                <span class="detalle-label">Cuenta</span>
                <span class="detalle-value">{{ trabajadorDetalles.cuenta }}</span>
              </div>
            </div>

            <div class="detalle-card">
              <div class="detalle-icon">🏡</div>
              <div class="detalle-info">
                <span class="detalle-label">Finca</span>
                <span class="detalle-value" v-if="trabajadorDetalles.fincaName">
                  {{ trabajadorDetalles.fincaCode }} - {{ trabajadorDetalles.fincaName }}
                </span>
                <span class="detalle-value sin-asignar" v-else>Sin asignar</span>
              </div>
            </div>

            <div class="detalle-card">
              <div class="detalle-icon">👥</div>
              <div class="detalle-info">
                <span class="detalle-label">Grupo</span>
                <span class="detalle-value" v-if="trabajadorDetalles.grupoNombre">
                  {{ trabajadorDetalles.grupoNombre }}
                </span>
                <span class="detalle-value sin-asignar" v-else>Sin asignar</span>
              </div>
            </div>

            <div class="detalle-card">
              <div class="detalle-icon">👔</div>
              <div class="detalle-info">
                <span class="detalle-label">Cargo</span>
                <span class="detalle-value" v-if="trabajadorDetalles.cargoName">
                  {{ trabajadorDetalles.cargoName }}
                </span>
                <span class="detalle-value sin-asignar" v-else>Sin asignar</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="detalles-actions">
            <button @click="editarDesdeDetalles" class="btn-action btn-editar-detail">
              <span class="btn-icon">✏️</span> Editar
            </button>
            <button @click="abrirHistorialSalarial" class="btn-action btn-editar-detail">
              <span class="btn-icon">💰</span> Historial salarial
            </button>
            <button @click="mostrarModalDetalles = false" class="btn-action btn-cerrar">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalSalario && trabajadorDetalles" class="modal">
      <div class="modal-content modal-salario">
        <HistorialSalarialModal :trabajador="trabajadorDetalles" @close="mostrarModalSalario = false" />
      </div>
    </div>

    <!-- Modal Advertencias de Desactivación -->
    <div v-if="mostrarModalAdvertencias" class="modal">
      <div class="modal-content modal-advertencias">
        <span class="close" @click="cerrarModalAdvertencias">&times;</span>

        <div class="advertencias-header">
          <div class="warning-icon">⚠️</div>
          <h3>Desactivar Trabajador</h3>
        </div>

        <div class="advertencias-content">
          <p class="trabajador-nombre" v-if="trabajadorADesactivar">
            <strong>{{ trabajadorADesactivar.nombre }}</strong>
            <span class="ruc-info">(RUC: {{ trabajadorADesactivar.ruc }})</span>
          </p>

          <div v-if="advertenciasDesactivacion.length > 0" class="advertencias-lista">
            <p class="advertencias-titulo">Se encontraron las siguientes situaciones:</p>
            <ul>
              <li v-for="(advertencia, index) in advertenciasDesactivacion" :key="index" class="advertencia-item">
                {{ advertencia }}
              </li>
            </ul>
          </div>

          <div v-else class="sin-advertencias">
            <span class="check-icon">✅</span>
            <p>No se encontraron situaciones pendientes para este trabajador.</p>
          </div>

          <p class="confirmacion-texto">
            ¿Está seguro que desea desactivar este trabajador?
          </p>
        </div>

        <div class="advertencias-actions">
          <button @click="cerrarModalAdvertencias" class="btn-cancelar-adv">
            Cancelar
          </button>
          <button @click="confirmarDesactivacion" class="btn-confirmar-adv">
            Sí, desactivar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TrabajadorService from '@/services/TrabajadorService'
import CrearTrabajador from './CrearTrabajador.vue'
import HistorialSalarialModal from './HistorialSalarialModal.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Trabajador } from '@/types/Trabajador'
import type { SearchFilter } from '@/types/EstadoCuenta'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
const isExportandoPdf = ref(false)
const isExportandoPdfGrupo = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalImportar = ref(false)
const mostrarModalDetalles = ref(false)
const mostrarModalAdvertencias = ref(false)
const mostrarModalSalario = ref(false)
const trabajadorEditando = ref<Trabajador | null>(null)
const trabajadorDetalles = ref<Trabajador | null>(null)
const trabajadorADesactivar = ref<Trabajador | null>(null)
const advertenciasDesactivacion = ref<string[]>([])
const isLoadingAdvertencias = ref(false)

// Importar
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImportando = ref(false)
const isDragging = ref(false)
const mensajeImport = ref('')
const mensajeImportTipo = ref<'info' | 'success' | 'error'>('info')

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const totalGlobal = computed(() => totalActivos.value + totalInactivos.value)

const porcentajeActivos = computed(() => {
  if (totalGlobal.value === 0) return 0
  return Math.round((totalActivos.value / totalGlobal.value) * 100)
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
    // Contar activos
    const responseActivos = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 1,
      filter: [{ key: 'activo', operator: 'EQUALS', value: 'true', logicalOperation: 'AND' }],
    })
    const dataActivos = responseActivos.data as Record<string, unknown>
    totalActivos.value = Number(dataActivos.totalElements) || 0

    // Contar inactivos
    const responseInactivos = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 1,
      filter: [{ key: 'activo', operator: 'EQUALS', value: 'false', logicalOperation: 'AND' }],
    })
    const dataInactivos = responseInactivos.data as Record<string, unknown>
    totalInactivos.value = Number(dataInactivos.totalElements) || 0

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

const verDetalles = async (trabajador: Trabajador) => {
  if (!trabajador.id) return

  try {
    const response = await TrabajadorService.obtenerTrabajadorPorId(trabajador.id)
    trabajadorDetalles.value = response.data
    mostrarModalDetalles.value = true
  } catch (error) {
    console.error('Error al cargar detalles:', error)
    notify.error('Error', 'No se pudo cargar los detalles')
  }
}

const editarDesdeDetalles = () => {
  if (trabajadorDetalles.value) {
    trabajadorEditando.value = trabajadorDetalles.value
    mostrarModalDetalles.value = false
    mostrarModalEditar.value = true
  }
}

const abrirHistorialSalarial = () => {
  mostrarModalSalario.value = true
}

const editarTrabajador = async (trabajador: Trabajador) => {
  if (!trabajador.id) return

  try {
    const response = await TrabajadorService.obtenerTrabajadorPorId(trabajador.id)
    trabajadorEditando.value = response.data
    mostrarModalEditar.value = true
  } catch (error) {
    console.error('Error al cargar el trabajador para editar:', error)
    notify.error('Error', 'No se pudo cargar el trabajador')
  }
}

const confirmarEliminar = async (trabajador: Trabajador) => {
  if (!trabajador.id) return

  // Solo mostrar advertencias si el trabajador está activo
  if (trabajador.activo) {
    isLoadingAdvertencias.value = true
    try {
      const response = await TrabajadorService.previewDesactivacion(trabajador.id)
      advertenciasDesactivacion.value = response.data.advertencias || []
      trabajadorADesactivar.value = trabajador
      mostrarModalAdvertencias.value = true
    } catch (error) {
      console.error('Error al obtener advertencias:', error)
      // Si falla el preview, mostrar confirmación simple
      const confirmed = await confirmDialog.delete(trabajador.nombre)
      if (confirmed) {
        await ejecutarDesactivacion(trabajador)
      }
    } finally {
      isLoadingAdvertencias.value = false
    }
  } else {
    // Si ya está inactivo, preguntar si quiere eliminarlo permanentemente
    notify.warning('Trabajador inactivo', 'Este trabajador ya está desactivado')
  }
}

const ejecutarDesactivacion = async (trabajador: Trabajador) => {
  try {
    await TrabajadorService.eliminarTrabajador(trabajador.id!)
    notify.success('Trabajador desactivado', 'El trabajador fue desactivado correctamente')
    cargarTrabajadores()
  } catch (error) {
    console.error('Error al desactivar:', error)
    notify.error('Error', 'No se pudo desactivar el trabajador')
  }
}

const confirmarDesactivacion = async () => {
  if (trabajadorADesactivar.value) {
    await ejecutarDesactivacion(trabajadorADesactivar.value)
    cerrarModalAdvertencias()
  }
}

const cerrarModalAdvertencias = () => {
  mostrarModalAdvertencias.value = false
  trabajadorADesactivar.value = null
  advertenciasDesactivacion.value = []
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

const exportarPdfPorCargo = async () => {
  isExportandoPdf.value = true
  try {
    // Obtener todos los trabajadores activos
    const response = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 10000,
      filter: [{ key: 'activo', operator: 'EQUALS', value: 'true', logicalOperation: 'AND' }]
    })

    const data = response.data as Record<string, unknown>
    let todosTrabajadores: Trabajador[] = []

    if (data.data && Array.isArray(data.data)) {
      todosTrabajadores = data.data as Trabajador[]
    } else if (data.content && Array.isArray(data.content)) {
      todosTrabajadores = data.content as Trabajador[]
    }

    if (todosTrabajadores.length === 0) {
      notify.warning('Sin datos', 'No hay trabajadores para exportar')
      return
    }

    // Agrupar por cargo
    const porCargo = new Map<string, Trabajador[]>()
    todosTrabajadores.forEach(t => {
      const cargo = t.cargoName || 'Sin Cargo Asignado'
      if (!porCargo.has(cargo)) {
        porCargo.set(cargo, [])
      }
      porCargo.get(cargo)!.push(t)
    })

    // Ordenar cargos alfabéticamente
    const cargosOrdenados = Array.from(porCargo.keys()).sort()

    // Crear PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // Título principal
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Listado de Trabajadores por Cargo', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    // Fecha de generación
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Generado: ${fechaActual}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Total general
    doc.text(`Total de trabajadores: ${todosTrabajadores.length}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    // Generar tabla por cada cargo
    cargosOrdenados.forEach((cargo, index) => {
      const trabajadoresCargo = porCargo.get(cargo)!.sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '')
      )

      // Verificar si necesitamos nueva página
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Encabezado del cargo
      doc.setFillColor(52, 73, 94)
      doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`${cargo} (${trabajadoresCargo.length})`, 16, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 8

      // Tabla de trabajadores
      const tableData = trabajadoresCargo.map((t, i) => [
        (i + 1).toString(),
        t.ruc || '',
        t.nombre || '',
        t.cuenta || '',
        t.fincaName || '-'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'RUC', 'Nombre', 'Cuenta', 'Finca']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [149, 165, 166],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 55 },
          3: { cellWidth: 30 },
          4: { cellWidth: 40 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
          // Pie de página
          doc.setFontSize(8)
          doc.setTextColor(128, 128, 128)
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          )
          doc.setTextColor(0, 0, 0)
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 15
    })

    // Descargar PDF
    doc.save(`trabajadores_por_cargo_${new Date().getTime()}.pdf`)
    notify.success('PDF generado', 'El archivo se descargó correctamente')

  } catch (error) {
    console.error('Error al generar PDF:', error)
    notify.error('Error', 'No se pudo generar el PDF')
  } finally {
    isExportandoPdf.value = false
  }
}

const exportarPdfPorGrupo = async () => {
  isExportandoPdfGrupo.value = true
  try {
    // Obtener todos los trabajadores activos
    const response = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 10000,
      filter: [{ key: 'activo', operator: 'EQUALS', value: 'true', logicalOperation: 'AND' }]
    })

    const data = response.data as Record<string, unknown>
    let todosTrabajadores: Trabajador[] = []

    if (data.data && Array.isArray(data.data)) {
      todosTrabajadores = data.data as Trabajador[]
    } else if (data.content && Array.isArray(data.content)) {
      todosTrabajadores = data.content as Trabajador[]
    }

    if (todosTrabajadores.length === 0) {
      notify.warning('Sin datos', 'No hay trabajadores para exportar')
      return
    }

    // Agrupar por grupo
    const porGrupo = new Map<string, Trabajador[]>()
    todosTrabajadores.forEach(t => {
      const grupo = t.grupoNombre || 'Sin Grupo Asignado'
      if (!porGrupo.has(grupo)) {
        porGrupo.set(grupo, [])
      }
      porGrupo.get(grupo)!.push(t)
    })

    // Ordenar grupos alfabéticamente
    const gruposOrdenados = Array.from(porGrupo.keys()).sort()

    // Crear PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // Título principal
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Listado de Trabajadores por Grupo', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    // Fecha de generación
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Generado: ${fechaActual}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Total general
    doc.text(`Total de trabajadores: ${todosTrabajadores.length}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    // Generar tabla por cada grupo
    gruposOrdenados.forEach((grupo) => {
      const trabajadoresGrupo = porGrupo.get(grupo)!.sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '')
      )

      // Verificar si necesitamos nueva página
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Encabezado del grupo
      doc.setFillColor(39, 174, 96)
      doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`${grupo} (${trabajadoresGrupo.length})`, 16, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 8

      // Tabla de trabajadores
      const tableData = trabajadoresGrupo.map((t, i) => [
        (i + 1).toString(),
        t.ruc || '',
        t.nombre || '',
        t.cuenta || '',
        t.fincaName || '-',
        t.cargoName || '-'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'RUC', 'Nombre', 'Cuenta', 'Finca', 'Cargo']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 204, 113],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 22 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
          // Pie de página
          doc.setFontSize(8)
          doc.setTextColor(128, 128, 128)
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          )
          doc.setTextColor(0, 0, 0)
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 15
    })

    // Descargar PDF
    doc.save(`trabajadores_por_grupo_${new Date().getTime()}.pdf`)
    notify.success('PDF generado', 'El archivo se descargó correctamente')

  } catch (error) {
    console.error('Error al generar PDF:', error)
    notify.error('Error', 'No se pudo generar el PDF')
  } finally {
    isExportandoPdfGrupo.value = false
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
.btn-importar { background-color: var(--color-primary); color: white; }

.btn-buscar, .btn-crear, .btn-importar, .btn-exportar, .btn-pdf {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-pdf { background-color: #9b59b6; color: white; }
.btn-pdf:hover:not(:disabled) { background-color: #8e44ad; }
.btn-pdf:disabled { background-color: #bdc3c7; cursor: not-allowed; }

.btn-pdf-grupo { background-color: #16a085; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-pdf-grupo:hover:not(:disabled) { background-color: #1abc9c; }
.btn-pdf-grupo:disabled { background-color: #bdc3c7; cursor: not-allowed; }

.btn-buscar:hover { background-color: #2980b9; }
.btn-crear:hover { background-color: #219a52; }
.btn-importar:hover { background-color: var(--color-primary-dark); }

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

.finca-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e0f2f1;
  color: #00796b;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.grupo-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
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

.nombre-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nombre-principal {
  font-weight: 500;
  color: #334155;
}

.cargo-subtexto {
  font-size: 0.75em;
  color: #64748b;
  font-style: italic;
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

.btn-ver { background-color: var(--color-primary); color: white; }
.btn-editar { background-color: #3498db; color: white; }
.btn-eliminar { background-color: #e74c3c; color: white; }
.btn-ver:hover { background-color: var(--color-primary-dark); }
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
.modal-detalles {
  max-width: 480px;
  padding: 0;
  overflow: hidden;
}

.detalles-wrapper {
  padding: 0;
}

.detalles-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  padding: 30px 25px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: 700;
  color: white;
  border: 3px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-info .nombre {
  margin: 0;
  color: white;
  font-size: 1.4em;
  font-weight: 600;
}

.header-info .ruc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9em;
}

.estado-badge-header {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
  margin-top: 5px;
}

.estado-badge-header.activo {
  background: rgba(46, 213, 115, 0.25);
  color: #7bed9f;
}

.estado-badge-header.inactivo {
  background: rgba(255, 107, 107, 0.25);
  color: #ff6b6b;
}

.detalles-grid {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detalle-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.detalle-card:hover {
  background: #f1f3f4;
  transform: translateX(5px);
}

.detalle-icon {
  font-size: 1.5em;
  width: 45px;
  height: 45px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.detalle-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detalle-info .detalle-label {
  font-size: 0.75em;
  color: #95a5a6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detalle-info .detalle-value {
  font-size: 1em;
  color: #2c3e50;
  font-weight: 500;
}

.detalle-info .sin-asignar {
  color: #bdc3c7;
  font-style: italic;
}

.detalles-actions {
  display: flex;
  gap: 12px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn-action {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-editar-detail {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
}

.btn-editar-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.btn-cerrar {
  background: white;
  color: #7f8c8d;
  border: 1px solid #ddd;
}

.btn-cerrar:hover {
  background: #f5f5f5;
  color: #2c3e50;
}

.btn-icon {
  font-size: 1em;
}
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
  z-index: 10;
}
.close:hover { color: #333; }

.modal-detalles .close {
  color: rgba(255, 255, 255, 0.8);
  top: 15px;
  right: 20px;
}
.modal-detalles .close:hover {
  color: white;
}

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
  border-color: var(--color-primary);
  background-color: #e3f2fd;
}

.drop-icon { font-size: 2.5em; margin-bottom: 10px; }
.file-input-hidden { display: none; }

.btn-seleccionar {
  display: inline-block;
  background-color: var(--color-primary);
  color: white;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-seleccionar:hover { background-color: var(--color-primary-dark); }

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

/* Modal Advertencias */
.modal-advertencias {
  max-width: 520px;
  padding: 0;
  overflow: hidden;
}

.advertencias-header {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.warning-icon {
  font-size: 2.5em;
}

.advertencias-header h3 {
  margin: 0;
  color: white;
  font-size: 1.4em;
}

.advertencias-content {
  padding: 25px;
}

.trabajador-nombre {
  font-size: 1.1em;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.ruc-info {
  color: #7f8c8d;
  font-weight: normal;
  margin-left: 8px;
}

.advertencias-titulo {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 12px;
}

.advertencias-lista ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.advertencia-item {
  background: #fff3cd;
  border-left: 4px solid #f39c12;
  padding: 12px 15px;
  margin-bottom: 10px;
  border-radius: 0 8px 8px 0;
  color: #856404;
  font-size: 0.95em;
  line-height: 1.5;
}

.sin-advertencias {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #d4edda;
  padding: 15px 20px;
  border-radius: 8px;
  color: #155724;
}

.check-icon {
  font-size: 1.5em;
}

.sin-advertencias p {
  margin: 0;
}

.confirmacion-texto {
  margin-top: 20px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.advertencias-actions {
  display: flex;
  gap: 12px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn-cancelar-adv, .btn-confirmar-adv {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.2s ease;
}

.btn-cancelar-adv {
  background: white;
  color: #7f8c8d;
  border: 1px solid #ddd;
}

.btn-cancelar-adv:hover {
  background: #f5f5f5;
  color: #2c3e50;
}

.btn-confirmar-adv {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-confirmar-adv:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.modal-advertencias .close {
  color: rgba(255, 255, 255, 0.8);
  top: 15px;
  right: 20px;
}

.modal-advertencias .close:hover {
  color: white;
}

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

  .modal-advertencias {
    width: 95%;
  }
}
</style>
