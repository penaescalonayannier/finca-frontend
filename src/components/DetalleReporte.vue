<!-- src/components/DetalleReporte.vue -->

<template>
  <div class="detalle-reporte">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <span class="detail-icon">📄</span>
        <div>
          <h3>Detalle del Reporte</h3>
          <p class="subtitle">Información completa del reporte y sus días de trabajo</p>
        </div>
      </div>
      <button class="btn-cerrar" @click="cerrar">
        <span class="close-icon">✕</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información del reporte...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="reporte" class="detail-content">
      <!-- Información del Reporte -->
      <div class="info-section">
        <h4 class="section-title">📋 Información del Reporte</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Código</span>
            <span class="info-value code-value">{{ reporte.codigo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fecha</span>
            <span class="info-value">{{ formatDate(reporte.fecha) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Bloque</span>
            <span class="info-value">{{ reporte.bloque }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Campo</span>
            <span class="info-value">{{ reporte.campo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Área</span>
            <span class="info-value">{{ reporte.area }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Norma</span>
            <span class="info-value">{{ reporte.norma }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Año</span>
            <span class="info-value">{{ reporte.year }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Mes</span>
            <span class="info-value">{{ reporte.mes }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Responsable</span>
            <span class="info-value">{{ reporte.trabajadorResponsableNombre || 'Sin asignar' }}</span>
          </div>
        </div>
      </div>

      <!-- Días y Trabajadores -->
      <div class="info-section trabajadores-section">
        <div class="section-header">
          <h4 class="section-title">📅 Días y Trabajadores</h4>
          <button @click="abrirModalAgregarDia" class="btn-agregar-dia">
            + Agregar Día
          </button>
        </div>

        <div v-if="isLoadingDias" class="loading-small">
          <div class="spinner-small"></div>
          <p>Cargando días y trabajadores...</p>
        </div>

        <div v-else-if="dias.length === 0" class="no-dias">
          <span class="empty-icon">📅</span>
          <p>No hay días registrados para este reporte</p>
          <button @click="abrirModalAgregarDia" class="btn-agregar-primario">
            Agregar el primer día
          </button>
        </div>

        <div v-else class="dias-container">
          <div v-for="dia in dias" :key="dia.id" class="dia-card">
            <div class="dia-header">
              <h5>{{ formatDate(dia.fecha) }}</h5>
              <div class="dia-actions">
                <button @click="eliminarDia(dia.id!)" class="btn-eliminar-dia" title="Eliminar día">🗑️</button>
              </div>
            </div>

            <table class="trabajadores-table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>RUC</th>
                  <th>Norma</th>
                  <th>Horas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!dia.trabajadores || dia.trabajadores.length === 0">
                  <td colspan="5" class="no-data">No hay trabajadores en este día</td>
                </tr>
                <tr v-for="trabajador in (dia.trabajadores || [])" :key="trabajador.id || Math.random()">
                  <td>
                    <strong>{{ trabajador.trabajadorNombre || 'Sin nombre' }}</strong>
                  </td>
                  <td>{{ trabajador.trabajadorRuc || '-' }}</td>
                  <td>
                    <span class="norma-badge">{{ trabajador.norma || '-' }}</span>
                  </td>
                  <td>
                    <span class="horas-badge">{{ trabajador.horas || '0' }}</span>
                  </td>
                  <td class="acciones-trabajador">
                    <button @click="editarTrabajadorDia(trabajador)" class="btn-editar-small">✏️</button>
                    <button @click="confirmarEliminarTrabajadorDia(trabajador)" class="btn-eliminar-small">🗑️</button>
                  </td>
                </tr>
              </tbody>
              <!-- ============ PIE DE TABLA CON TOTALES ============ -->
              <tfoot>
                <!-- Total de Horas -->
                <tr class="total-row">
                  <td colspan="3" class="total-label">
                    <strong>Total Horas</strong>
                  </td>
                  <td class="total-value total-horas">
                    <strong>{{ calcularTotalHoras(dia) }}</strong>
                  </td>
                  <td></td>
                </tr>
                <!-- Total de Norma -->
                <tr class="total-row">
                  <td colspan="3" class="total-label">
                    <strong>Total Norma</strong>
                  </td>
                  <td class="total-value total-norma">
                    <strong>{{ calcularTotalNorma(dia) }}</strong>
                  </td>
                  <td></td>
                </tr>
                <!-- Cantidad de trabajadores -->
                <tr class="total-row">
                  <td colspan="3" class="total-label">
                    <strong>Cantidad Trabajadores</strong>
                  </td>
                  <td class="total-value total-count">
                    <strong>{{ dia.trabajadores?.length || 0 }}</strong>
                  </td>
                  <td></td>
                </tr>
                <!-- Botón Agregar Trabajador -->
                <tr>
                  <td colspan="5" class="footer-actions">
                    <button @click="abrirModalAgregarTrabajador(dia.id!)" class="btn-agregar-trabajador-dia">
                      + Agregar Trabajador
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Metadatos -->
      <div class="info-section">
        <h4 class="section-title">⚙️ Metadatos</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value id-value">{{ reporte.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="error-container">
      <span class="error-icon">⚠️</span>
      <p>No se pudo cargar la información del reporte</p>
      <button class="btn-reintentar" @click="cargarReporte">Reintentar</button>
    </div>

    <!-- Modal Agregar Día -->
    <div v-if="mostrarModalAgregarDia" class="modal">
      <div class="modal-content modal-small modal-scroll">
        <span class="close" @click="cerrarModalAgregarDia">&times;</span>
        <h3>Agregar Día</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>Fecha *</label>
            <input v-model="nuevoDia.fecha" type="date" class="form-input" required />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="agregarDia" class="btn-guardar" :disabled="isGuardandoDia">
            {{ isGuardandoDia ? 'Guardando...' : 'Agregar' }}
          </button>
          <button @click="cerrarModalAgregarDia" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Trabajador a Día -->
    <div v-if="mostrarModalAgregarTrabajador" class="modal">
      <div class="modal-content modal-asignar modal-scroll">
        <span class="close" @click="cerrarModalAgregarTrabajador">&times;</span>
        <h3>Agregar Trabajador al Día</h3>
        <div class="modal-body">
          <!-- Buscador -->
          <div class="form-group">
            <label>Buscar trabajador</label>
            <div class="search-wrapper">
              <input
                v-model="buscarTrabajador"
                type="text"
                class="form-input"
                placeholder="Escriba para buscar por nombre o RUC..."
                @input="filtrarTrabajadores"
                @keyup.escape="limpiarBusqueda"
              />
              <span v-if="buscarTrabajador" class="search-clear" @click="limpiarBusqueda">✕</span>
            </div>
            <small class="helper-text">{{ trabajadoresFiltrados.length }} trabajadores disponibles</small>
          </div>

          <div class="form-group">
            <label>Trabajador *</label>
            <select v-model="nuevoTrabajadorDia.trabajadorId" class="form-select" required size="5">
              <option value="">Seleccione un trabajador</option>
              <option 
                v-for="trabajador in trabajadoresFiltrados" 
                :key="trabajador.id" 
                :value="trabajador.id"
                class="trabajador-option"
              >
                {{ trabajador.nombre }} - {{ trabajador.ruc }} 
                <span v-if="trabajador.cargo" class="cargo-option">| {{ trabajador.cargo }}</span>
              </option>
            </select>
            <span v-if="trabajadoresFiltrados.length === 0 && buscarTrabajador" class="no-results">
              No se encontraron trabajadores con "{{ buscarTrabajador }}"
            </span>
          </div>

          <div class="form-row">
            <div class="form-group form-group-half">
              <label>Horas *</label>
              <input v-model="nuevoTrabajadorDia.horas" type="text" placeholder="Ej: 8" class="form-input" required />
            </div>
            <div class="form-group form-group-half">
              <label>Norma</label>
              <input v-model="nuevoTrabajadorDia.norma" type="text" placeholder="Ej: 2.5" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="validarYAgregarTrabajadorADia" class="btn-guardar" :disabled="isGuardandoTrabajador">
            {{ isGuardandoTrabajador ? 'Guardando...' : 'Agregar' }}
          </button>
          <button @click="cerrarModalAgregarTrabajador" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Editar Trabajador Día -->
    <div v-if="mostrarModalEditarTrabajador" class="modal">
      <div class="modal-content modal-small modal-scroll">
        <span class="close" @click="cerrarModalEditarTrabajador">&times;</span>
        <h3>Editar Trabajador</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>Trabajador</label>
            <p><strong>{{ trabajadorEditando?.trabajadorNombre }}</strong></p>
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>Horas *</label>
              <input v-model="trabajadorEditando.horas" type="text" placeholder="Ej: 8" class="form-input" required />
            </div>
            <div class="form-group form-group-half">
              <label>Norma</label>
              <input v-model="trabajadorEditando.norma" type="text" placeholder="Ej: 2.5" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="validarYActualizarTrabajadorDia" class="btn-guardar" :disabled="isGuardandoTrabajador">
            {{ isGuardandoTrabajador ? 'Guardando...' : 'Actualizar' }}
          </button>
          <button @click="cerrarModalEditarTrabajador" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminar Trabajador -->
    <div v-if="mostrarModalEliminarTrabajador" class="modal">
      <div class="modal-content modal-small modal-scroll">
        <span class="close" @click="cerrarModalEliminarTrabajador">&times;</span>
        <h3>Confirmar Eliminación</h3>
        <div class="modal-body">
          <p>¿Eliminar al trabajador <strong>{{ trabajadorEliminar?.trabajadorNombre }}</strong> de este día?</p>
        </div>
        <div class="modal-footer">
          <button @click="eliminarTrabajadorDia" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminarTrabajador = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Horas Excedidas -->
    <div v-if="mostrarModalConfirmacionHoras" class="modal">
      <div class="modal-content modal-small modal-scroll">
        <span class="close" @click="cerrarModalConfirmacionHoras">&times;</span>
        <h3>⚠️ Exceso de Horas</h3>
        <div class="modal-body">
          <div class="warning-box">
            <p>Ha ingresado <strong>{{ horasExcedidas }} horas</strong>, lo cual <strong>excede el límite de 8 horas por día</strong>.</p>
            <p>¿Desea continuar asignando este exceso de horas al trabajador?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="confirmarOperacionConHorasExcedidas" class="btn-advertencia">
            {{ isGuardandoTrabajador ? 'Guardando...' : 'Continuar de Todas Formas' }}
          </button>
          <button @click="cerrarModalConfirmacionHoras" class="btn-cancelar" :disabled="isGuardandoTrabajador">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import ReporteService from '@/services/ReporteService'
import DiaTrabajoService from '@/services/DiaTrabajoService'
import TrabajadorService from '@/services/TrabajadorService'
import type { Reporte } from '@/types/Reporte'
import type { DiaTrabajo, TrabajadorDia } from '@/types/DiaTrabajo'
import type { Trabajador } from '@/types/Trabajador'
import type { AxiosError } from 'axios'

// ==================== UTILIDADES DE FECHA ====================
const formatDate = (date: string): string => {
  if (!date) return '-'
  
  const partes = date.split('-')
  if (partes.length === 3) {
    const year = parseInt(partes[0])
    const month = parseInt(partes[1]) - 1
    const day = parseInt(partes[2])
    
    const d = new Date(year, month, day)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  try {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

// ==================== FUNCIONES DE TOTALES ====================
const calcularTotalHoras = (dia: DiaTrabajo): string => {
  if (!dia.trabajadores || dia.trabajadores.length === 0) {
    return '0'
  }
  
  let total = 0
  for (const trabajador of dia.trabajadores) {
    const horas = parseFloat(trabajador.horas)
    if (!isNaN(horas)) {
      total += horas
    }
  }
  return total.toString()
}

const calcularTotalNorma = (dia: DiaTrabajo): string => {
  if (!dia.trabajadores || dia.trabajadores.length === 0) {
    return '0'
  }
  
  let total = 0
  for (const trabajador of dia.trabajadores) {
    const norma = parseFloat(trabajador.norma)
    if (!isNaN(norma)) {
      total += norma
    }
  }
  return total.toFixed(2)
}

// ==================== PROPS Y EMITS ====================
const props = defineProps<{
  reporteId: string
}>()

const emit = defineEmits<{
  close: []
  edit: [reporte: Reporte]
}>()

// ==================== ESTADO ====================
const reporte = ref<Reporte | null>(null)
const isLoading = ref(false)

const dias = ref<DiaTrabajo[]>([])
const isLoadingDias = ref(false)
const trabajadores = ref<Trabajador[]>([])

// Buscador
const buscarTrabajador = ref('')
const trabajadoresFiltrados = ref<Trabajador[]>([])

// Modales
const mostrarModalAgregarDia = ref(false)
const mostrarModalAgregarTrabajador = ref(false)
const mostrarModalEditarTrabajador = ref(false)
const mostrarModalEliminarTrabajador = ref(false)

// Estados de carga
const isGuardandoDia = ref(false)
const isGuardandoTrabajador = ref(false)

// Datos para modales
const nuevoDia = ref({ fecha: '' })
const diaTrabajoSeleccionado = ref<string>('')
const nuevoTrabajadorDia = ref({ trabajadorId: '', horas: '', norma: '' })
const trabajadorEditando = ref<TrabajadorDia | null>(null)
const trabajadorEliminar = ref<TrabajadorDia | null>(null)

// Modal de confirmación para horas > 8
const mostrarModalConfirmacionHoras = ref(false)
const horasExcedidas = ref('')
const operacionPendiente = ref<'agregar' | 'actualizar' | null>(null)

// ==================== COMPUTED ====================
const trabajadoresOrdenados = computed(() => {
  return [...trabajadores.value].sort((a, b) => {
    return a.nombre.localeCompare(b.nombre)
  })
})

// ==================== MÉTODOS ====================

// Cargar Trabajadores
const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
    filtrarTrabajadores()
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

// Cargar Reporte
const cargarReporte = async () => {
  if (!props.reporteId) return
  
  isLoading.value = true
  try {
    const response = await ReporteService.obtenerReportePorId(props.reporteId)
    reporte.value = response.data
    console.log('📄 Reporte cargado:', reporte.value)
    await cargarDias()
  } catch (error) {
    console.error('❌ Error al cargar el reporte:', error)
    reporte.value = null
  } finally {
    isLoading.value = false
  }
}

// Cargar Días
const cargarDias = async () => {
  if (!props.reporteId) return
  
  isLoadingDias.value = true
  try {
    const response = await DiaTrabajoService.obtenerDiasPorReporte(props.reporteId)
    
    const items = response.data.items || []
    dias.value = items.map((dia: any) => ({
      ...dia,
      trabajadores: dia.trabajadores || []
    }))
    
    console.log('✅ Días encontrados:', dias.value.length)
  } catch (error) {
    console.error('❌ Error al cargar días:', error)
    dias.value = []
  } finally {
    isLoadingDias.value = false
  }
}

// ==================== BUSCADOR DE TRABAJADORES ====================
const filtrarTrabajadores = () => {
  const termino = buscarTrabajador.value.toLowerCase().trim()
  
  if (!termino) {
    trabajadoresFiltrados.value = trabajadoresOrdenados.value
    return
  }
  
  trabajadoresFiltrados.value = trabajadoresOrdenados.value.filter(t => {
    const nombre = t.nombre?.toLowerCase() || ''
    const ruc = t.ruc?.toLowerCase() || ''
    const cuenta = t.cuenta?.toLowerCase() || ''
    const cargo = t.cargo?.toLowerCase() || ''
    
    return nombre.includes(termino) || 
           ruc.includes(termino) || 
           cuenta.includes(termino) ||
           cargo.includes(termino)
  })
}

const limpiarBusqueda = () => {
  buscarTrabajador.value = ''
  filtrarTrabajadores()
}

// ==================== GESTIÓN DE DÍAS ====================

const abrirModalAgregarDia = () => {
  nuevoDia.value = { fecha: '' }
  mostrarModalAgregarDia.value = true
}

const cerrarModalAgregarDia = () => {
  mostrarModalAgregarDia.value = false
  nuevoDia.value = { fecha: '' }
}

const agregarDia = async () => {
  if (!nuevoDia.value.fecha) {
    alert('Seleccione una fecha')
    return
  }

  isGuardandoDia.value = true
  try {
    await DiaTrabajoService.agregarDia(props.reporteId, nuevoDia.value)
    cerrarModalAgregarDia()
    await cargarDias()
  } catch (error) {
    console.error('Error al agregar día:', error)
    const err = error as AxiosError<{ message: string }>
    alert(err.response?.data?.message || 'Error al agregar el día')
  } finally {
    isGuardandoDia.value = false
  }
}

const eliminarDia = async (diaId: string) => {
  if (!confirm('¿Está seguro de eliminar este día y todos sus trabajadores?')) return
  
  try {
    await DiaTrabajoService.eliminarDia(diaId)
    await cargarDias()
  } catch (error) {
    console.error('Error al eliminar día:', error)
    const err = error as AxiosError<{ message: string }>
    alert(err.response?.data?.message || 'Error al eliminar el día')
  }
}

// ==================== GESTIÓN DE TRABAJADORES POR DÍA ====================

const abrirModalAgregarTrabajador = (diaId: string) => {
  diaTrabajoSeleccionado.value = diaId
  nuevoTrabajadorDia.value = { trabajadorId: '', horas: '', norma: '' }
  buscarTrabajador.value = ''
  filtrarTrabajadores()
  mostrarModalAgregarTrabajador.value = true
}

const cerrarModalAgregarTrabajador = () => {
  mostrarModalAgregarTrabajador.value = false
  diaTrabajoSeleccionado.value = ''
  nuevoTrabajadorDia.value = { trabajadorId: '', horas: '', norma: '' }
  buscarTrabajador.value = ''
}

const agregarTrabajadorADiaConfirmado = async () => {
  isGuardandoTrabajador.value = true
  try {
    await DiaTrabajoService.agregarTrabajadorADia(
      diaTrabajoSeleccionado.value,
      nuevoTrabajadorDia.value
    )
    cerrarModalAgregarTrabajador()
    cerrarModalConfirmacionHoras()
    await cargarDias()
  } catch (error) {
    console.error('Error al agregar trabajador:', error)
    const err = error as AxiosError<{ message: string }>
    alert(err.response?.data?.message || 'Error al agregar el trabajador')
  } finally {
    isGuardandoTrabajador.value = false
  }
}

const agregarTrabajadorADia = agregarTrabajadorADiaConfirmado

const validarYAgregarTrabajadorADia = () => {
  if (!nuevoTrabajadorDia.value.trabajadorId) {
    alert('Seleccione un trabajador')
    return
  }
  if (!nuevoTrabajadorDia.value.horas.trim()) {
    alert('Ingrese las horas')
    return
  }

  const horas = parseFloat(nuevoTrabajadorDia.value.horas)
  if (isNaN(horas)) {
    alert('Las horas deben ser un número válido')
    return
  }

  if (horas > 8) {
    horasExcedidas.value = nuevoTrabajadorDia.value.horas
    operacionPendiente.value = 'agregar'
    mostrarModalConfirmacionHoras.value = true
    return
  }

  agregarTrabajadorADiaConfirmado()
}

const editarTrabajadorDia = (trabajador: TrabajadorDia) => {
  trabajadorEditando.value = { ...trabajador }
  mostrarModalEditarTrabajador.value = true
}

const cerrarModalEditarTrabajador = () => {
  mostrarModalEditarTrabajador.value = false
  trabajadorEditando.value = null
}

const actualizarTrabajadorDiaConfirmado = async () => {
  if (!trabajadorEditando.value?.id) return

  isGuardandoTrabajador.value = true
  try {
    await DiaTrabajoService.actualizarTrabajadorDia(
      trabajadorEditando.value.id,
      {
        horas: trabajadorEditando.value.horas,
        norma: trabajadorEditando.value.norma || ''
      }
    )
    cerrarModalEditarTrabajador()
    cerrarModalConfirmacionHoras()
    await cargarDias()
  } catch (error) {
    console.error('Error al actualizar trabajador:', error)
    const err = error as AxiosError<{ message: string }>
    alert(err.response?.data?.message || 'Error al actualizar el trabajador')
  } finally {
    isGuardandoTrabajador.value = false
  }
}

const validarYActualizarTrabajadorDia = () => {
  if (!trabajadorEditando.value?.id) return
  if (!trabajadorEditando.value.horas.trim()) {
    alert('Ingrese las horas')
    return
  }

  const horas = parseFloat(trabajadorEditando.value.horas)
  if (isNaN(horas)) {
    alert('Las horas deben ser un número válido')
    return
  }

  if (horas > 8) {
    horasExcedidas.value = trabajadorEditando.value.horas
    operacionPendiente.value = 'actualizar'
    mostrarModalConfirmacionHoras.value = true
    return
  }

  actualizarTrabajadorDiaConfirmado()
}

const actualizarTrabajadorDia = validarYActualizarTrabajadorDia

const confirmarEliminarTrabajadorDia = (trabajador: TrabajadorDia) => {
  trabajadorEliminar.value = trabajador
  mostrarModalEliminarTrabajador.value = true
}

const eliminarTrabajadorDia = async () => {
  if (!trabajadorEliminar.value?.id) return
  
  try {
    await DiaTrabajoService.eliminarTrabajadorDia(trabajadorEliminar.value.id)
    mostrarModalEliminarTrabajador.value = false
    trabajadorEliminar.value = null
    await cargarDias()
  } catch (error) {
    console.error('Error al eliminar trabajador:', error)
    const err = error as AxiosError<{ message: string }>
    alert(err.response?.data?.message || 'Error al eliminar el trabajador')
  }
}

// Modal Confirmación Horas
const cerrarModalConfirmacionHoras = () => {
  mostrarModalConfirmacionHoras.value = false
  horasExcedidas.value = ''
  operacionPendiente.value = null
}

const confirmarOperacionConHorasExcedidas = async () => {
  if (operacionPendiente.value === 'agregar') {
    await agregarTrabajadorADiaConfirmado()
  } else if (operacionPendiente.value === 'actualizar') {
    await actualizarTrabajadorDiaConfirmado()
  }
  cerrarModalConfirmacionHoras()
}

// Cerrar
const cerrar = () => {
  emit('close')
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  await cargarTrabajadores()
  await cargarReporte()
})

watch(() => props.reporteId, () => {
  cargarReporte()
})

watch(trabajadores, () => {
  filtrarTrabajadores()
})

watch(mostrarModalAgregarTrabajador, (nuevoValor) => {
  if (nuevoValor) {
    filtrarTrabajadores()
  }
})
</script>

<style scoped>
.detalle-reporte {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  max-height: 90vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
  border-radius: 16px 16px 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.detail-icon {
  font-size: 2.5em;
  background: #e8eaf6;
  padding: 12px;
  border-radius: 12px;
  display: inline-block;
}

.detail-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4em;
  font-weight: 600;
}

.detail-header .subtitle {
  margin: 4px 0 0;
  color: #888;
  font-size: 0.9em;
}

.btn-cerrar {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cerrar:hover {
  background: #f0f0f0;
  transform: rotate(90deg);
}

.close-icon {
  font-size: 1.5em;
  color: #888;
  line-height: 1;
}

.loading-container {
  padding: 60px 30px;
  text-align: center;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.spinner-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #9b59b6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.detail-content {
  padding: 25px 30px 30px;
}

.info-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-title {
  color: #2c3e50;
  font-size: 1.1em;
  font-weight: 600;
  margin: 0;
}

.btn-agregar-dia {
  padding: 6px 16px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.btn-agregar-dia:hover {
  background-color: #219a52;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.85em;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.05em;
  color: #2c3e50;
  font-weight: 500;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  word-break: break-word;
}

.code-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
  background: #e3f2fd;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #888;
  background: #f5f5f5;
}

.trabajadores-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #f5f0f9 100%);
  padding: 20px 25px;
  border-radius: 12px;
  border-left: 4px solid #9b59b6;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 0.95em;
}

.no-dias {
  text-align: center;
  padding: 30px;
  color: #888;
}

.empty-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 10px;
}

.no-dias p {
  margin-bottom: 15px;
  font-size: 0.95em;
}

.btn-agregar-primario {
  padding: 10px 24px;
  background-color: #9b59b6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-agregar-primario:hover {
  background-color: #8e44ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.dias-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dia-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.dia-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.dia-actions {
  display: flex;
  gap: 5px;
}

.btn-eliminar-dia {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.1em;
  padding: 0 5px;
  transition: all 0.3s ease;
}

.btn-eliminar-dia:hover {
  color: #c0392b;
  transform: scale(1.1);
}

.trabajadores-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.trabajadores-table th,
.trabajadores-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.trabajadores-table th {
  background: #f8f5fc;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trabajadores-table tr:hover {
  background-color: #fafafa;
}

.trabajadores-table .no-data {
  text-align: center;
  color: #888;
  padding: 15px;
}

.norma-badge {
  display: inline-block;
  padding: 3px 12px;
  background: #e8eaf6;
  color: #3f51b5;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.horas-badge {
  display: inline-block;
  padding: 3px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.acciones-trabajador {
  display: flex;
  gap: 5px;
}

.acciones-trabajador button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.btn-editar-small {
  background-color: #3498db;
  color: white;
}

.btn-editar-small:hover {
  background-color: #2980b9;
  transform: scale(1.1);
}

.btn-eliminar-small {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar-small:hover {
  background-color: #c0392b;
  transform: scale(1.1);
}

/* ============ ESTILOS PARA TOTALES ============ */
.total-row {
  background-color: #f8f5fc !important;
  border-top: 2px solid #9b59b6;
}

.total-row td {
  padding: 6px 12px !important;
  font-weight: 600;
}

.total-label {
  text-align: right !important;
  color: #4a148c;
  font-size: 0.85em;
}

.total-value {
  text-align: center !important;
  font-size: 1em;
}

.total-horas {
  color: #1976d2;
}

.total-norma {
  color: #2e7d32;
}

.total-count {
  color: #e65100;
}

/* ============ FIN ESTILOS PARA TOTALES ============ */

.footer-actions {
  padding: 10px 0;
  text-align: center;
}

.btn-agregar-trabajador-dia {
  padding: 6px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
}

.btn-agregar-trabajador-dia:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

/* ============ BUSCADOR ============ */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-wrapper .form-input {
  padding-right: 35px;
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
  font-size: 1.2em;
  padding: 0 5px;
  transition: all 0.3s ease;
  line-height: 1;
}

.search-clear:hover {
  color: #e74c3c;
  transform: translateY(-50%) scale(1.2);
}

.helper-text {
  display: block;
  color: #888;
  font-size: 0.75em;
  margin-top: 3px;
}

.cargo-option {
  color: #666;
  font-size: 0.85em;
}

.no-results {
  display: block;
  color: #e74c3c;
  font-size: 0.85em;
  padding: 8px;
  text-align: center;
  font-style: italic;
  background: #ffebee;
  border-radius: 4px;
  margin-top: 5px;
}

/* Estilo para el select con scroll */
.form-select[size] {
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.form-select option {
  padding: 6px 10px;
  border-bottom: 1px solid #f5f5f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-select option:hover {
  background-color: #e3f2fd;
}

.form-select option:checked {
  background-color: #3498db;
  color: white;
}

.trabajador-option {
  cursor: pointer;
}

/* ============ MODALES CON SCROLL ============ */
.modal-scroll {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.modal-scroll .close {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  padding: 15px 20px 0 0;
  margin: 0;
}

.modal-scroll h3 {
  padding: 15px 20px 0 20px;
  margin: 0;
  flex-shrink: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px 20px 20px 20px;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.modal-footer {
  flex-shrink: 0;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-footer .btn-guardar,
.modal-footer .btn-cancelar {
  min-width: 100px;
}

/* Modales generales */
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
  padding: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-content {
  background-color: #fff;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-asignar {
  max-width: 550px;
}

.modal-small {
  max-width: 400px;
}

.modal-content .close {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  padding: 15px 20px 0 0;
  margin: 0;
  align-self: flex-end;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  line-height: 1;
}

.modal-content .close:hover {
  color: #333;
  transform: rotate(90deg);
}

.modal-content h3 {
  padding: 0 20px 15px 20px;
  margin: 0;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
  color: #2c3e50;
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

.error-container {
  padding: 60px 30px;
  text-align: center;
}

.error-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
}

.error-container p {
  color: #666;
  margin-bottom: 20px;
}

.btn-reintentar {
  padding: 10px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-reintentar:hover {
  background: #2980b9;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group-half {
  flex: 1;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-advertencia {
  background-color: #e67e22;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-advertencia:hover:not(:disabled) {
  background-color: #d35400;
}

.btn-advertencia:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.warning-box {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.warning-box p {
  margin: 0 0 10px 0;
  color: #856404;
  font-size: 0.95em;
  line-height: 1.5;
}

.warning-box p:last-child {
  margin-bottom: 0;
}

.detalle-reporte::-webkit-scrollbar {
  width: 8px;
}

.detalle-reporte::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.detalle-reporte::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.detalle-reporte::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 768px) {
  .detail-header {
    padding: 20px;
  }

  .detail-content {
    padding: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .btn-agregar-dia {
    width: 100%;
  }

  .trabajadores-section {
    padding: 15px;
  }

  .trabajadores-table {
    font-size: 0.8em;
  }

  .trabajadores-table th,
  .trabajadores-table td {
    padding: 6px 8px;
  }

  .acciones-trabajador {
    flex-direction: column;
    gap: 3px;
  }

  .modal {
    padding: 10px;
    align-items: flex-end;
  }

  .modal-content {
    max-height: 95vh;
    width: 100%;
    border-radius: 16px 16px 0 0;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn-guardar,
  .modal-footer .btn-cancelar {
    width: 100%;
    min-width: unset;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-group-half {
    flex: none;
  }

  .form-select[size] {
    min-height: 100px;
    max-height: 150px;
  }

  .form-select option {
    padding: 4px 8px;
    font-size: 0.9em;
  }

  .total-label {
    font-size: 0.75em;
  }

  .total-value {
    font-size: 0.85em;
  }
}

@media (max-width: 480px) {
  .detail-icon {
    font-size: 2em;
    padding: 8px;
  }

  .detail-header h3 {
    font-size: 1.1em;
  }

  .trabajadores-table {
    font-size: 0.7em;
  }

  .trabajadores-table th,
  .trabajadores-table td {
    padding: 4px 6px;
  }

  .norma-badge,
  .horas-badge {
    font-size: 0.7em;
    padding: 2px 8px;
  }

  .modal-content h3 {
    font-size: 1.1em;
    padding: 0 15px 10px 15px;
  }

  .modal-body {
    padding: 15px;
  }

  .modal-footer {
    padding: 10px 15px;
  }

  .total-label {
    font-size: 0.7em;
  }

  .total-value {
    font-size: 0.8em;
  }
}
</style>