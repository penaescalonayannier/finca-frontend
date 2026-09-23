<!-- src/components/DetalleReporteExcel.vue -->

<template>
  <div class="detalle-excel">
    <!-- Header -->
    <div class="header">
      <div class="header-info">
        <span class="codigo">{{ reporte?.codigo || 'Cargando...' }}</span>
        <span class="periodo">{{ reporte?.mes }} {{ reporte?.year }}</span>
        <span class="ubicacion">{{ reporte?.bloque }} / {{ reporte?.campo }}</span>
      </div>
      <div class="header-actions">
        <span v-if="guardando" class="guardando-indicator">
          <span class="mini-spinner"></span> Guardando...
        </span>
        <span v-else-if="ultimoGuardado" class="guardado-indicator">
          Guardado
        </span>
        <button class="btn-cerrar" @click="cerrar" title="Cerrar">&times;</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Contenido Excel -->
    <div v-else-if="reporte" class="excel-container">
      <!-- Barra de acciones -->
      <div class="acciones-bar">
        <div class="resumen">
          <div class="stat">
            <span class="stat-valor">{{ dias.length }}</span>
            <span class="stat-label">Días</span>
          </div>
          <div class="stat">
            <span class="stat-valor">{{ trabajadoresUnicos.length }}</span>
            <span class="stat-label">Trabajadores</span>
          </div>
          <div class="stat">
            <span class="stat-valor">{{ totalHorasReporte }}</span>
            <span class="stat-label">Horas</span>
          </div>
        </div>
        <div class="botones-acciones">
          <button @click="abrirModalAgregarDia" class="btn-accion btn-agregar-dia">
            + Día
          </button>
          <button @click="abrirModalAgregarTrabajador" class="btn-accion btn-agregar-trabajador" :disabled="dias.length === 0">
            + Trabajador
          </button>
          <button @click="definirDiasLaborables" class="btn-accion btn-definir-laborables" :disabled="dias.length === 0 || guardando">
            {{ guardando ? 'Aplicando...' : 'L-V 8h' }}
          </button>
          <button @click="definirDiasLaborables4h" class="btn-accion btn-definir-laborables-4h" :disabled="dias.length === 0 || guardando">
            {{ guardando ? 'Aplicando...' : 'L-V 4h' }}
          </button>
          <button @click="definirSabados" class="btn-accion btn-definir-sabados" :disabled="!tieneSabados || guardando">
            {{ guardando ? 'Aplicando...' : 'Sábados 4h' }}
          </button>
          <button @click="definirDomingos" class="btn-accion btn-definir-domingos" :disabled="!tieneDomingos || guardando">
            {{ guardando ? 'Aplicando...' : 'Domingos 4h' }}
          </button>
        </div>
      </div>

      <!-- Instrucciones -->
      <div class="instrucciones">
        Click en celda para editar horas | Enter o click fuera para guardar | Esc para cancelar
      </div>

      <!-- Tabla Excel -->
      <div class="excel-wrapper">
        <table class="excel-table" v-if="dias.length > 0 && trabajadoresUnicos.length > 0">
          <thead>
            <tr>
              <th class="col-trabajador sticky-col">Trabajador</th>
              <th
                v-for="dia in diasOrdenados"
                :key="dia.id"
                class="col-dia"
                :class="{ 'col-sabado': esSabado(dia.fecha), 'col-domingo': esDomingo(dia.fecha) }"
                :title="formatDateFull(dia.fecha)"
              >
                <div class="dia-header">
                  <span class="dia-nombre">{{ formatDayName(dia.fecha) }}</span>
                  <span class="dia-numero">{{ formatDayNumber(dia.fecha) }}</span>
                  <button
                    @click.stop="abrirModalHorasColumna(dia)"
                    class="btn-aplicar-horas-columna"
                    :disabled="trabajadoresUnicos.length === 0 || guardando"
                    title="Definir horas para todos los trabajadores de este día"
                    aria-label="Definir horas para toda la columna"
                  >⏱</button>
                  <button
                    @click.stop="eliminarDia(dia)"
                    class="btn-eliminar-dia"
                    title="Eliminar día"
                  >×</button>
                </div>
              </th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trabajador in trabajadoresUnicos" :key="trabajador.id">
              <td class="col-trabajador sticky-col">
                <div class="trabajador-info">
                  <span class="trabajador-nombre">{{ trabajador.nombre }}</span>
                  <span class="trabajador-cargo" v-if="trabajador.cargo">{{ trabajador.cargo }}</span>
                  <button
                    @click="eliminarTrabajadorDeReporte(trabajador)"
                    class="btn-eliminar-trabajador"
                    title="Eliminar de todo el reporte"
                  >🗑️</button>
                </div>
              </td>
              <td
                v-for="dia in diasOrdenados"
                :key="dia.id"
                class="col-dia celda-datos"
                :class="{
                  'celda-guardando': celdaGuardando === `${trabajador.id}-${dia.id}`,
                  'col-sabado': esSabado(dia.fecha),
                  'col-domingo': esDomingo(dia.fecha)
                }"
              >
                <!-- Con datos -->
                <template v-if="getTrabajadorDia(trabajador.id, dia) || celdaEditando?.startsWith(`${trabajador.id}-${dia.id}-`)">
                  <div class="celda-split">
                    <!-- Horas -->
                    <div
                      class="celda-horas-parte"
                      :class="[
                        getCeldaClass(trabajador.id, dia),
                        { editando: celdaEditando === `${trabajador.id}-${dia.id}-horas` }
                      ]"
                      @click="iniciarEdicion(trabajador, dia, 'horas')"
                    >
                      <input
                        v-if="celdaEditando === `${trabajador.id}-${dia.id}-horas`"
                        ref="inputEdicion"
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        class="input-celda"
                        :value="valorEditando"
                        @input="valorEditando = ($event.target as HTMLInputElement).value"
                        @blur="guardarEdicion(trabajador, dia, 'horas')"
                        @keyup.enter="guardarEdicion(trabajador, dia, 'horas')"
                        @keyup.escape="cancelarEdicion"
                      />
                      <span v-else class="valor-display">{{ getHoras(trabajador.id, dia) || '-' }}</span>
                    </div>
                    <!-- Norma -->
                    <div
                      class="celda-norma-parte"
                      :class="{ editando: celdaEditando === `${trabajador.id}-${dia.id}-norma` }"
                      @click="iniciarEdicion(trabajador, dia, 'norma')"
                    >
                      <input
                        v-if="celdaEditando === `${trabajador.id}-${dia.id}-norma`"
                        ref="inputEdicion"
                        type="number"
                        step="0.01"
                        min="0"
                        class="input-celda"
                        :value="valorEditando"
                        @input="valorEditando = ($event.target as HTMLInputElement).value"
                        @blur="guardarEdicion(trabajador, dia, 'norma')"
                        @keyup.enter="guardarEdicion(trabajador, dia, 'norma')"
                        @keyup.escape="cancelarEdicion"
                      />
                      <span v-else class="valor-display norma">{{ getNorma(trabajador.id, dia) || '-' }}</span>
                    </div>
                  </div>
                  <button
                    @click.stop="eliminarTrabajadorDeDia(trabajador.id, dia)"
                    class="btn-eliminar-celda"
                    title="Eliminar de este día"
                  >×</button>
                </template>
                <!-- Sin datos - permitir agregar -->
                <template v-else>
                  <div class="celda-vacia-add" @click="iniciarEdicion(trabajador, dia, 'horas')">
                    <span class="add-icon">+</span>
                  </div>
                </template>
              </td>
              <td class="col-total celda-total">
                {{ getTotalTrabajador(trabajador.id) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="fila-total">
              <td class="col-trabajador sticky-col"><strong>Total por día</strong></td>
              <td
                v-for="dia in diasOrdenados"
                :key="dia.id"
                class="col-dia celda-total-dia"
                :class="{ 'col-sabado': esSabado(dia.fecha), 'col-domingo': esDomingo(dia.fecha) }"
              >
                {{ getTotalDia(dia) }}
              </td>
              <td class="col-total celda-gran-total">
                <strong>{{ totalHorasReporte }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Sin datos -->
        <div v-else class="sin-datos-mensaje">
          <div v-if="dias.length === 0">
            <p>No hay días registrados</p>
            <button @click="abrirModalAgregarDia" class="btn-accion btn-agregar-dia">+ Agregar primer día</button>
          </div>
          <div v-else>
            <p>No hay trabajadores asignados</p>
            <button @click="abrirModalAgregarTrabajador" class="btn-accion btn-agregar-trabajador">+ Agregar trabajador</button>
          </div>
        </div>
      </div>

      <!-- Leyenda -->
      <div class="leyenda" v-if="dias.length > 0 && trabajadoresUnicos.length > 0">
        <div class="leyenda-item">
          <span class="leyenda-color alto"></span>
          <span>&gt;8h</span>
        </div>
        <div class="leyenda-item">
          <span class="leyenda-color normal"></span>
          <span>4-8h</span>
        </div>
        <div class="leyenda-item">
          <span class="leyenda-color bajo"></span>
          <span>&lt;4h</span>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Días -->
    <div v-if="mostrarModalDia" class="modal-overlay" @click.self="cerrarModalDia">
      <div class="modal-box modal-dias">
        <div class="modal-header">
          <h3>Agregar Días - {{ reporte?.mes }} {{ reporte?.year }}</h3>
          <button @click="cerrarModalDia" class="btn-cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="seleccion-acciones">
            <button @click="seleccionarTodosDias" class="btn-seleccionar-todos">Seleccionar todos</button>
            <button @click="diasSeleccionados = []" class="btn-desmarcar-todos">Desmarcar todos</button>
            <label class="checkbox-horas-extras">
              <input type="checkbox" v-model="incluirDomingos" />
              <span>Horas Extras (domingos)</span>
            </label>
            <span class="dias-contador">{{ diasSeleccionados.length }} día(s) seleccionado(s)</span>
          </div>
          <div class="dias-grid">
            <div
              v-for="diaNum in diasDelMes"
              :key="diaNum.fecha"
              class="dia-checkbox"
              :class="{
                seleccionado: diasSeleccionados.includes(diaNum.fecha),
                existente: diaNum.existe,
                domingo: diaNum.esDomingo,
                'domingo-habilitado': diaNum.esDomingo && incluirDomingos && !diaNum.existe,
                disabled: diaNum.existe || (diaNum.esDomingo && !incluirDomingos)
              }"
              @click="!diaNum.existe && (!diaNum.esDomingo || incluirDomingos) && toggleDiaSeleccionado(diaNum.fecha)"
            >
              <span class="dia-num">{{ diaNum.numero }}</span>
              <span class="dia-nombre-corto">{{ diaNum.nombreCorto }}</span>
              <span v-if="diaNum.existe" class="dia-existe-badge">Ya existe</span>
              <span v-else-if="diaNum.esDomingo && incluirDomingos" class="dia-extra-badge">Extra</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalDia" class="btn-cancelar">Cancelar</button>
          <button @click="agregarDias" class="btn-guardar" :disabled="diasSeleccionados.length === 0 || guardandoDia">
            {{ guardandoDia ? 'Guardando...' : `Agregar ${diasSeleccionados.length} día(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Trabajadores -->
    <div v-if="mostrarModalTrabajador" class="modal-overlay" @click.self="cerrarModalTrabajador">
      <div class="modal-box modal-trabajador">
        <div class="modal-header">
          <h3>Agregar Trabajadores</h3>
          <button @click="cerrarModalTrabajador" class="btn-cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Selección de días -->
          <div class="form-group">
            <label>Días ({{ diasParaTrabajador.length }} seleccionado{{ diasParaTrabajador.length !== 1 ? 's' : '' }})</label>
            <div class="dias-mini-grid">
              <div
                v-for="dia in diasOrdenados"
                :key="dia.id"
                class="dia-mini-checkbox"
                :class="{ seleccionado: diasParaTrabajador.includes(dia.id!) }"
                @click="toggleDiaParaTrabajador(dia.id!)"
              >
                <span class="dia-mini-num">{{ formatDayNumber(dia.fecha) }}</span>
                <span class="dia-mini-nombre">{{ formatDayName(dia.fecha) }}</span>
              </div>
            </div>
          </div>
          <!-- Búsqueda de trabajadores -->
          <div class="form-group">
            <label>Buscar Trabajadores</label>
            <input
              type="text"
              v-model="buscarTrabajadorTexto"
              @input="filtrarTrabajadores"
              placeholder="Nombre o RUC..."
              class="input-buscar"
            />
          </div>
          <div class="lista-info">
            <span class="info-listado">{{ trabajadoresFiltrados.length }} trabajadores</span>
            <span v-if="trabajadoresSeleccionados.length > 0" class="info-seleccionados">
              | {{ trabajadoresSeleccionados.length }} seleccionado(s)
              <button @click="trabajadoresSeleccionados = []" class="btn-limpiar">Limpiar</button>
            </span>
          </div>
          <div class="lista-trabajadores">
            <div
              v-for="t in trabajadoresFiltrados"
              :key="t.id"
              class="trabajador-item"
              :class="{ seleccionado: trabajadoresSeleccionados.includes(t.id!) }"
              @click="toggleTrabajador(t.id!)"
            >
              <input
                type="checkbox"
                :checked="trabajadoresSeleccionados.includes(t.id!)"
                @click.stop
                @change="toggleTrabajador(t.id!)"
                class="checkbox-trabajador"
              />
              <span class="nombre">{{ t.nombre }}</span>
              <span class="ruc">{{ t.ruc }}</span>
            </div>
            <div v-if="trabajadoresFiltrados.length === 0" class="no-resultados">
              No se encontraron trabajadores
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalTrabajador" class="btn-cancelar">Cancelar</button>
          <button
            @click="agregarTrabajadoresADias"
            class="btn-guardar"
            :disabled="diasParaTrabajador.length === 0 || trabajadoresSeleccionados.length === 0 || guardandoTrabajador"
          >
            {{ guardandoTrabajador ? 'Guardando...' : `Agregar ${trabajadoresSeleccionados.length} a ${diasParaTrabajador.length} día(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal definir horas para una columna/día -->
    <div v-if="mostrarModalHorasColumna" class="modal-overlay" @click.self="cerrarModalHorasColumna">
      <div class="modal-box modal-horas-columna">
        <div class="modal-header">
          <h3>Definir horas del día</h3>
          <button @click="cerrarModalHorasColumna" class="btn-cerrar-modal" :disabled="guardando">&times;</button>
        </div>
        <div class="modal-body">
          <p class="texto-modal-horas">
            Se aplicará el valor a la sección <strong>Horas</strong> de los
            {{ trabajadoresEnColumna }} trabajador(es) del {{ diaHorasSeleccionado ? formatDateFull(diaHorasSeleccionado.fecha) : '' }}.
            La norma de cada trabajador se conservará sin cambios.
          </p>
          <div class="form-group">
            <label for="horas-columna">Horas a aplicar</label>
            <input
              id="horas-columna"
              v-model="horasColumna"
              type="number"
              min="0"
              max="24"
              step="0.5"
              class="input-numero"
              :disabled="guardando"
              @keyup.enter="aplicarHorasColumna"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalHorasColumna" class="btn-cancelar" :disabled="guardando">Cancelar</button>
          <button @click="aplicarHorasColumna" class="btn-guardar" :disabled="guardando">
            {{ guardando ? 'Aplicando...' : 'Aplicar a toda la columna' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import ReporteService from '@/services/ReporteService'
import DiaTrabajoService from '@/services/DiaTrabajoService'
import TrabajadorService from '@/services/TrabajadorService'
import type { Reporte } from '@/types/Reporte'
import type { DiaTrabajo, TrabajadorDia } from '@/types/DiaTrabajo'
import type { Trabajador } from '@/types/Trabajador'

interface TrabajadorResumen {
  id: string
  nombre: string
  cargo?: string
}

const props = defineProps<{ reporteId: string }>()
const emit = defineEmits<{ close: [] }>()

const reporte = ref<Reporte | null>(null)
const dias = ref<DiaTrabajo[]>([])
const isLoading = ref(false)

// Estado de edición
const celdaEditando = ref<string | null>(null)
const celdaGuardando = ref<string | null>(null)
const valorEditando = ref<string>('')
const valorOriginal = ref<string>('')
const guardando = ref(false)
const ultimoGuardado = ref(false)
const inputEdicion = ref<HTMLInputElement[]>([])

// Modal Agregar Días
const mostrarModalDia = ref(false)
const diasSeleccionados = ref<string[]>([])
const guardandoDia = ref(false)
const incluirDomingos = ref(false)

// Modal Agregar Trabajadores
const mostrarModalTrabajador = ref(false)
const diasParaTrabajador = ref<string[]>([])
const trabajadoresSeleccionados = ref<string[]>([])
const buscarTrabajadorTexto = ref('')
const trabajadoresList = ref<Trabajador[]>([])
const trabajadoresFiltrados = ref<Trabajador[]>([])
const guardandoTrabajador = ref(false)

// Aplicación masiva de horas para un día/columna específico
const mostrarModalHorasColumna = ref(false)
const diaHorasSeleccionado = ref<DiaTrabajo | null>(null)
const horasColumna = ref('8')

// Meses en español para mapeo
const mesesMap: Record<string, number> = {
  'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3,
  'Mayo': 4, 'Junio': 5, 'Julio': 6, 'Agosto': 7,
  'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
}

// Generar días del mes del reporte
const diasDelMes = computed(() => {
  if (!reporte.value) return []

  const year = parseInt(reporte.value.year)
  const mesNombre = reporte.value.mes
  const mes = mesesMap[mesNombre] ?? new Date().getMonth()

  const diasEnMes = new Date(year, mes + 1, 0).getDate()
  const diasExistentes = dias.value.map(d => d.fecha)

  const resultado: { numero: number; fecha: string; nombreCorto: string; existe: boolean; esDomingo: boolean }[] = []

  for (let i = 1; i <= diasEnMes; i++) {
    const fecha = `${year}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const d = new Date(year, mes, i)
    const nombreCorto = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()
    const esDomingo = d.getDay() === 0
    resultado.push({
      numero: i,
      fecha,
      nombreCorto,
      existe: diasExistentes.includes(fecha),
      esDomingo
    })
  }

  return resultado
})

const toggleDiaSeleccionado = (fecha: string) => {
  const index = diasSeleccionados.value.indexOf(fecha)
  if (index === -1) {
    diasSeleccionados.value.push(fecha)
  } else {
    diasSeleccionados.value.splice(index, 1)
  }
}

// Seleccionar todos los días disponibles (no existentes, domingos solo si incluirDomingos)
const seleccionarTodosDias = () => {
  const disponibles = diasDelMes.value
    .filter(d => !d.existe && (!d.esDomingo || incluirDomingos.value))
    .map(d => d.fecha)
  diasSeleccionados.value = disponibles
}

// Días ordenados por fecha
const diasOrdenados = computed(() => {
  return [...dias.value].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
})

// Lista única de trabajadores de todos los días
const trabajadoresUnicos = computed((): TrabajadorResumen[] => {
  const map = new Map<string, TrabajadorResumen>()

  dias.value.forEach(dia => {
    dia.trabajadores?.forEach(t => {
      if (t.trabajadorId && !map.has(t.trabajadorId)) {
        map.set(t.trabajadorId, {
          id: t.trabajadorId,
          nombre: t.trabajadorNombre || 'Sin nombre',
          cargo: (t as any).cargoNombre
        })
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// Total de horas del reporte
const totalHorasReporte = computed(() => {
  let total = 0
  dias.value.forEach(dia => {
    dia.trabajadores?.forEach(t => {
      total += parseFloat(t.horas) || 0
    })
  })
  return total.toFixed(1)
})

// Verificar si hay sábados. Las filas de trabajadores faltantes se crean al aplicar.
const tieneSabados = computed(() => {
  return dias.value.some(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    return d.getDay() === 6
  })
})

// Verificar si hay domingos. Las filas de trabajadores faltantes se crean al aplicar.
const tieneDomingos = computed(() => {
  return dias.value.some(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    return d.getDay() === 0
  })
})

const trabajadoresEnColumna = computed(() =>
  diaHorasSeleccionado.value ? trabajadoresUnicos.value.length : 0
)

// Obtener el registro TrabajadorDia
const getTrabajadorDia = (trabajadorId: string, dia: DiaTrabajo): TrabajadorDia | undefined => {
  return dia.trabajadores?.find(t => t.trabajadorId === trabajadorId)
}

// Obtener horas de un trabajador en un día específico
const getHoras = (trabajadorId: string, dia: DiaTrabajo): string => {
  const trabajador = getTrabajadorDia(trabajadorId, dia)
  if (!trabajador) return ''
  return trabajador.horas
}

// Obtener norma de un trabajador en un día específico
const getNorma = (trabajadorId: string, dia: DiaTrabajo): string => {
  const trabajador = getTrabajadorDia(trabajadorId, dia)
  if (!trabajador) return ''
  return trabajador.norma || ''
}

// Obtener clase CSS según las horas
const getCeldaClass = (trabajadorId: string, dia: DiaTrabajo): string => {
  const horas = parseFloat(getHoras(trabajadorId, dia)) || 0
  if (horas === 0) return 'celda-vacia'
  if (horas > 8) return 'horas-alto'
  if (horas >= 4) return 'horas-normal'
  return 'horas-bajo'
}

// Total de horas por trabajador
const getTotalTrabajador = (trabajadorId: string): string => {
  let total = 0
  dias.value.forEach(dia => {
    const t = dia.trabajadores?.find(t => t.trabajadorId === trabajadorId)
    if (t) total += parseFloat(t.horas) || 0
  })
  return total.toFixed(1)
}

// Total de horas por día
const getTotalDia = (dia: DiaTrabajo): string => {
  let total = 0
  dia.trabajadores?.forEach(t => {
    total += parseFloat(t.horas) || 0
  })
  return total.toFixed(1)
}

// Formateo de fechas
const formatDayName = (fecha: string): string => {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()
}

const formatDayNumber = (fecha: string): string => {
  const d = new Date(fecha + 'T00:00:00')
  return d.getDate().toString()
}

const formatDateFull = (fecha: string): string => {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const esSabado = (fecha: string): boolean => {
  const d = new Date(fecha + 'T00:00:00')
  return d.getDay() === 6
}

const esDomingo = (fecha: string): boolean => {
  const d = new Date(fecha + 'T00:00:00')
  return d.getDay() === 0
}

// ==================== EDICIÓN DE CELDAS ====================

const campoEditando = ref<'horas' | 'norma'>('horas')

const iniciarEdicion = async (trabajador: TrabajadorResumen, dia: DiaTrabajo, campo: 'horas' | 'norma' = 'horas') => {
  const celdaKey = `${trabajador.id}-${dia.id}-${campo}`
  if (celdaEditando.value === celdaKey) return

  if (celdaEditando.value) {
    cancelarEdicion()
  }

  const td = getTrabajadorDia(trabajador.id, dia)

  celdaEditando.value = celdaKey
  campoEditando.value = campo

  if (campo === 'horas') {
    valorOriginal.value = td?.horas || ''
    valorEditando.value = td?.horas || ''
  } else {
    valorOriginal.value = td?.norma || ''
    valorEditando.value = td?.norma || ''
  }

  await nextTick()
  const inputs = inputEdicion.value
  if (inputs && inputs.length > 0) {
    inputs[0].focus()
    inputs[0].select()
  }
}

const cancelarEdicion = () => {
  celdaEditando.value = null
  valorEditando.value = ''
  valorOriginal.value = ''
}

const guardarEdicion = async (trabajador: TrabajadorResumen, dia: DiaTrabajo, campo: 'horas' | 'norma' = 'horas') => {
  const nuevoValor = valorEditando.value.trim()
  const celdaKey = `${trabajador.id}-${dia.id}`

  // Si no cambió, solo cancelar
  if (nuevoValor === valorOriginal.value) {
    cancelarEdicion()
    return
  }

  // Validaciones según el campo
  if (campo === 'horas') {
    if (!nuevoValor) {
      cancelarEdicion()
      return
    }
    const horas = parseFloat(nuevoValor)
    if (isNaN(horas) || horas < 0 || horas > 24) {
      alert('Las horas deben ser un número entre 0 y 24')
      cancelarEdicion()
      return
    }
  } else {
    if (!nuevoValor) {
      cancelarEdicion()
      return
    }
    const norma = parseFloat(nuevoValor)
    if (isNaN(norma) || norma < 0) {
      alert('La norma debe ser un número mayor o igual a 0')
      cancelarEdicion()
      return
    }
  }

  celdaEditando.value = null
  celdaGuardando.value = celdaKey
  guardando.value = true
  ultimoGuardado.value = false

  const td = getTrabajadorDia(trabajador.id, dia)

  try {
    if (td && td.id) {
      // Actualizar registro existente
      const updateData = {
        horas: campo === 'horas' ? nuevoValor : td.horas,
        norma: campo === 'norma' ? nuevoValor : (td.norma || '1')
      }
      await DiaTrabajoService.actualizarTrabajadorDia(td.id, updateData)

      if (campo === 'horas') {
        td.horas = nuevoValor
      } else {
        td.norma = nuevoValor
      }
    } else {
      // Crear nuevo registro (solo si es campo horas)
      if (campo === 'horas') {
        await DiaTrabajoService.agregarTrabajadorADia(dia.id!, {
          trabajadorId: trabajador.id,
          horas: nuevoValor,
          norma: '1'
        })
        await cargarDias()
      }
    }

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al guardar:', error)
    alert(error.response?.data?.message || 'Error al guardar')
    if (td) {
      if (campo === 'horas') {
        td.horas = valorOriginal.value
      } else {
        td.norma = valorOriginal.value
      }
    }
  } finally {
    celdaGuardando.value = null
    guardando.value = false
    valorEditando.value = ''
    valorOriginal.value = ''
  }
}

// ==================== GESTIÓN DE DÍAS ====================

const abrirModalAgregarDia = () => {
  diasSeleccionados.value = []
  mostrarModalDia.value = true
}

const cerrarModalDia = () => {
  mostrarModalDia.value = false
  diasSeleccionados.value = []
  incluirDomingos.value = false
}

const agregarDias = async () => {
  if (diasSeleccionados.value.length === 0) return

  guardandoDia.value = true
  try {
    // Agregar cada día seleccionado
    for (const fecha of diasSeleccionados.value) {
      try {
        await DiaTrabajoService.agregarDia(props.reporteId, { fecha })
      } catch (e: any) {
        console.warn(`Día ${fecha} ya existe o error:`, e.message)
      }
    }

    cerrarModalDia()
    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al agregar días:', error)
    alert(error.response?.data?.message || 'Error al agregar los días')
  } finally {
    guardandoDia.value = false
  }
}

const eliminarDia = async (dia: DiaTrabajo) => {
  if (!dia.id) return
  if (!confirm(`¿Eliminar el día ${formatDateFull(dia.fecha)} y todos sus trabajadores?`)) return

  try {
    await DiaTrabajoService.eliminarDia(dia.id)
    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al eliminar día:', error)
    alert(error.response?.data?.message || 'Error al eliminar el día')
  }
}

const eliminarTrabajadorDeDia = async (trabajadorId: string, dia: DiaTrabajo) => {
  const td = getTrabajadorDia(trabajadorId, dia)
  if (!td || !td.id) return

  const trabajadorNombre = td.trabajadorNombre || 'este trabajador'
  if (!confirm(`¿Eliminar a ${trabajadorNombre} del día ${formatDateFull(dia.fecha)}?`)) return

  guardando.value = true
  try {
    await DiaTrabajoService.eliminarTrabajadorDia(td.id)
    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al eliminar trabajador:', error)
    alert(error.response?.data?.message || 'Error al eliminar el trabajador')
  } finally {
    guardando.value = false
  }
}

const eliminarTrabajadorDeReporte = async (trabajador: TrabajadorResumen) => {
  // Contar en cuántos días está el trabajador
  const diasConTrabajador = dias.value.filter(dia =>
    dia.trabajadores?.some(t => t.trabajadorId === trabajador.id)
  )

  if (diasConTrabajador.length === 0) return

  const mensaje = diasConTrabajador.length === 1
    ? `¿Eliminar a ${trabajador.nombre} del reporte?`
    : `¿Eliminar a ${trabajador.nombre} de los ${diasConTrabajador.length} días donde aparece?`

  if (!confirm(mensaje)) return

  guardando.value = true
  try {
    // Eliminar de cada día
    for (const dia of diasConTrabajador) {
      const td = dia.trabajadores?.find(t => t.trabajadorId === trabajador.id)
      if (td?.id) {
        await DiaTrabajoService.eliminarTrabajadorDia(td.id)
      }
    }

    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al eliminar trabajador del reporte:', error)
    alert(error.response?.data?.message || 'Error al eliminar el trabajador')
  } finally {
    guardando.value = false
  }
}

// ==================== DEFINIR HORAS POR COLUMNA ====================

const abrirModalHorasColumna = (dia: DiaTrabajo) => {
  const primerTrabajador = dia.trabajadores?.find(trabajador => trabajador.id)
  if (trabajadoresUnicos.value.length === 0) {
    alert('No hay trabajadores registrados en el reporte')
    return
  }

  diaHorasSeleccionado.value = dia
  horasColumna.value = primerTrabajador?.horas || '8'
  mostrarModalHorasColumna.value = true
}

const cerrarModalHorasColumna = (forzar = false) => {
  if (guardando.value && !forzar) return
  mostrarModalHorasColumna.value = false
  diaHorasSeleccionado.value = null
  horasColumna.value = '8'
}

const aplicarHorasColumna = async () => {
  const dia = diaHorasSeleccionado.value
  const horas = Number(horasColumna.value)

  if (!dia || !dia.id) return
  if (!Number.isFinite(horas) || horas < 0 || horas > 24) {
    alert('Las horas deben ser un número entre 0 y 24')
    return
  }

  const trabajadores = trabajadoresUnicos.value
  if (trabajadores.length === 0) {
    alert('No hay trabajadores registrados en el reporte')
    return
  }

  if (!confirm(`¿Aplicar ${horas} hora(s) a los ${trabajadores.length} trabajador(es) del ${formatDateFull(dia.fecha)}? La norma actual se conservará.`)) {
    return
  }

  guardando.value = true
  ultimoGuardado.value = false
  try {
    await aplicarHorasADia(dia, String(horas), true)

    await cargarDias()
    cerrarModalHorasColumna(true)
    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al definir horas para la columna:', error)
    alert(error.response?.data?.message || 'No fue posible aplicar las horas a toda la columna')
  } finally {
    guardando.value = false
  }
}

// ==================== DEFINIR DÍAS MASIVAMENTE ====================

const aplicarHorasADia = async (dia: DiaTrabajo, horas: string, conservarNorma = false) => {
  if (!dia.id) return

  for (const trabajador of trabajadoresUnicos.value) {
    const registro = getTrabajadorDia(trabajador.id, dia)
    const norma = conservarNorma ? (registro?.norma || '0') : '0'

    if (registro?.id) {
      await DiaTrabajoService.actualizarTrabajadorDia(registro.id, { horas, norma })
    } else {
      // Los días agregados posteriormente no tienen filas todavía. Se crean al
      // aplicar la acción masiva para que la columna reciba el valor solicitado.
      await DiaTrabajoService.agregarTrabajadorADia(dia.id, {
        trabajadorId: trabajador.id,
        horas,
        norma
      })
    }
  }
}

const aplicarHorasADias = async (diasObjetivo: DiaTrabajo[], horas: string) => {
  for (const dia of diasObjetivo) {
    await aplicarHorasADia(dia, horas)
  }
}

const definirDiasLaborables = async () => {
  // Obtener días laborables (lunes a viernes)
  const laborables = dias.value.filter(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    const dayOfWeek = d.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5
  })

  if (laborables.length === 0) {
    alert('No hay días laborables en el reporte')
    return
  }

  const totalTrabajadores = laborables.length * trabajadoresUnicos.value.length

  if (totalTrabajadores === 0) {
    alert('No hay trabajadores en el reporte')
    return
  }

  if (!confirm(`¿Definir 8 horas y 0 norma para ${totalTrabajadores} registro(s) en ${laborables.length} día(s) laborable(s)?`)) {
    return
  }

  guardando.value = true
  try {
    await aplicarHorasADias(laborables, '8')

    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al definir días laborables:', error)
    alert(error.response?.data?.message || 'Error al definir días laborables')
  } finally {
    guardando.value = false
  }
}

const definirDiasLaborables4h = async () => {
  // Obtener días laborables (lunes a viernes)
  const laborables = dias.value.filter(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    const dayOfWeek = d.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5
  })

  if (laborables.length === 0) {
    alert('No hay días laborables en el reporte')
    return
  }

  const totalTrabajadores = laborables.length * trabajadoresUnicos.value.length

  if (totalTrabajadores === 0) {
    alert('No hay trabajadores en el reporte')
    return
  }

  if (!confirm(`¿Definir 4 horas y 0 norma para ${totalTrabajadores} registro(s) en ${laborables.length} día(s) laborable(s)?`)) {
    return
  }

  guardando.value = true
  try {
    await aplicarHorasADias(laborables, '4')

    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al definir días laborables 4h:', error)
    alert(error.response?.data?.message || 'Error al definir días laborables')
  } finally {
    guardando.value = false
  }
}

const definirSabados = async () => {
  // Obtener días que son sábado
  const sabados = dias.value.filter(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    return d.getDay() === 6
  })

  if (sabados.length === 0) {
    alert('No hay sábados en el reporte')
    return
  }

  const totalTrabajadores = sabados.length * trabajadoresUnicos.value.length

  if (totalTrabajadores === 0) {
    alert('No hay trabajadores en el reporte')
    return
  }

  if (!confirm(`¿Definir 4 horas y 0 norma para ${totalTrabajadores} registro(s) en ${sabados.length} sábado(s)?`)) {
    return
  }

  guardando.value = true
  try {
    await aplicarHorasADias(sabados, '4')

    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al definir sábados:', error)
    alert(error.response?.data?.message || 'Error al definir sábados')
  } finally {
    guardando.value = false
  }
}

const definirDomingos = async () => {
  // Obtener días que son domingo
  const domingos = dias.value.filter(dia => {
    const d = new Date(dia.fecha + 'T00:00:00')
    return d.getDay() === 0
  })

  if (domingos.length === 0) {
    alert('No hay domingos en el reporte')
    return
  }

  const totalTrabajadores = domingos.length * trabajadoresUnicos.value.length

  if (totalTrabajadores === 0) {
    alert('No hay trabajadores en el reporte')
    return
  }

  if (!confirm(`¿Definir 4 horas extras y 0 norma para ${totalTrabajadores} registro(s) en ${domingos.length} domingo(s)?`)) {
    return
  }

  guardando.value = true
  try {
    await aplicarHorasADias(domingos, '4')

    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al definir domingos:', error)
    alert(error.response?.data?.message || 'Error al definir domingos')
  } finally {
    guardando.value = false
  }
}

// ==================== GESTIÓN DE TRABAJADORES ====================

const cargarTrabajadoresList = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadoresList.value = response.data.data || []
    filtrarTrabajadores()
  } catch (e) {
    console.error('Error cargando trabajadores:', e)
  }
}

const filtrarTrabajadores = () => {
  const term = buscarTrabajadorTexto.value.toLowerCase().trim()
  // Solo mostrar trabajadores activos
  const activos = trabajadoresList.value.filter(t => t.activo === true)
  const sorted = [...activos].sort((a, b) => a.nombre.localeCompare(b.nombre))

  if (!term) {
    trabajadoresFiltrados.value = sorted
    return
  }

  trabajadoresFiltrados.value = sorted.filter(t =>
    t.nombre?.toLowerCase().includes(term) || t.ruc?.toLowerCase().includes(term)
  )
}

const toggleTrabajador = (id: string) => {
  const index = trabajadoresSeleccionados.value.indexOf(id)
  if (index === -1) {
    trabajadoresSeleccionados.value.push(id)
  } else {
    trabajadoresSeleccionados.value.splice(index, 1)
  }
}

const toggleDiaParaTrabajador = (diaId: string) => {
  const index = diasParaTrabajador.value.indexOf(diaId)
  if (index === -1) {
    diasParaTrabajador.value.push(diaId)
  } else {
    diasParaTrabajador.value.splice(index, 1)
  }
}

const abrirModalAgregarTrabajador = async () => {
  if (trabajadoresList.value.length === 0) {
    await cargarTrabajadoresList()
  }
  // Seleccionar todos los días por defecto
  diasParaTrabajador.value = diasOrdenados.value.map(d => d.id!).filter(Boolean)
  trabajadoresSeleccionados.value = []
  buscarTrabajadorTexto.value = ''
  filtrarTrabajadores()
  mostrarModalTrabajador.value = true
}

const cerrarModalTrabajador = () => {
  mostrarModalTrabajador.value = false
  trabajadoresSeleccionados.value = []
  diasParaTrabajador.value = []
}

const agregarTrabajadoresADias = async () => {
  if (diasParaTrabajador.value.length === 0 || trabajadoresSeleccionados.value.length === 0) return

  guardandoTrabajador.value = true
  try {
    // Agregar cada trabajador a cada día seleccionado
    for (const diaId of diasParaTrabajador.value) {
      for (const trabajadorId of trabajadoresSeleccionados.value) {
        try {
          await DiaTrabajoService.agregarTrabajadorADia(diaId, {
            trabajadorId,
            horas: '0',
            norma: '0'
          })
        } catch (e: any) {
          console.warn(`Trabajador ${trabajadorId} en día ${diaId} ya existe o error:`, e.message)
        }
      }
    }

    cerrarModalTrabajador()
    await cargarDias()

    ultimoGuardado.value = true
    setTimeout(() => { ultimoGuardado.value = false }, 2000)
  } catch (error: any) {
    console.error('Error al agregar trabajadores:', error)
    alert(error.response?.data?.message || 'Error al agregar los trabajadores')
  } finally {
    guardandoTrabajador.value = false
  }
}

// ==================== CARGAR DATOS ====================

const cargarReporte = async () => {
  if (!props.reporteId) return
  isLoading.value = true
  try {
    const response = await ReporteService.obtenerReportePorId(props.reporteId)
    reporte.value = response.data
    await cargarDias()
  } catch (e) {
    console.error(e)
    reporte.value = null
  } finally {
    isLoading.value = false
  }
}

const cargarDias = async () => {
  if (!props.reporteId) return
  try {
    const response = await DiaTrabajoService.obtenerDiasPorReporte(props.reporteId)
    dias.value = (response.data.items || []).map((d: any) => ({
      ...d,
      trabajadores: d.trabajadores || []
    }))
  } catch (e) {
    console.error(e)
    dias.value = []
  }
}

const cerrar = () => {
  emit('close')
}

onMounted(() => {
  cargarReporte()
})

watch(() => props.reporteId, () => cargarReporte())
</script>

<style scoped>
.detalle-excel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  min-width: 800px;
  width: auto;
  max-width: calc(100vw - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, #2E7D5B, #3A8E6A);
  color: white;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guardando-indicator,
.guardado-indicator {
  font-size: 0.85em;
  padding: 4px 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.guardando-indicator {
  background: rgba(255, 193, 7, 0.3);
}

.guardado-indicator {
  background: rgba(255, 255, 255, 0.2);
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.codigo {
  font-size: 1.2em;
  font-weight: 700;
}

.periodo {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
}

.ubicacion {
  font-size: 0.85em;
  opacity: 0.9;
}

.btn-cerrar {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-cerrar:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E3F0E8;
  border-top-color: #2E7D5B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.excel-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.acciones-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 15px;
}

.resumen {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #E3F0E8 0%, #B8D8C5 100%);
  border-radius: 10px;
  border: 1px solid #B8D8C5;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid #B8D8C5;
}

.stat:last-child {
  border-right: none;
}

.stat-valor {
  font-size: 1.5em;
  font-weight: 700;
  color: #1D5A3F;
}

.stat-label {
  font-size: 0.7em;
  color: #3A8E6A;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.botones-acciones {
  display: flex;
  gap: 8px;
}

.btn-accion {
  padding: 6px 10px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  font-size: 0.78em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-agregar-dia {
  background: #3498db;
  color: white;
}

.btn-agregar-dia:hover {
  background: #2980b9;
}

.btn-agregar-trabajador {
  background: #2E7D5B;
  color: white;
}

.btn-agregar-trabajador:hover:not(:disabled) {
  background: #3A8E6A;
}

.btn-definir-laborables {
  background: #5c6bc0;
  color: white;
}

.btn-definir-laborables:hover:not(:disabled) {
  background: #3f51b5;
}

.btn-definir-laborables-4h {
  background: #7e57c2;
  color: white;
}

.btn-definir-laborables-4h:hover:not(:disabled) {
  background: #673ab7;
}

.btn-definir-sabados {
  background: #ff9800;
  color: white;
}

.btn-definir-sabados:hover:not(:disabled) {
  background: #f57c00;
}

.btn-definir-domingos {
  background: #e65100;
  color: white;
}

.btn-definir-domingos:hover:not(:disabled) {
  background: #bf360c;
}

.btn-accion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.instrucciones {
  font-size: 0.75em;
  color: #888;
  text-align: center;
  margin-bottom: 8px;
  padding: 6px;
  background: #f5f5f5;
  border-radius: 4px;
}

.excel-wrapper {
  flex: 1;
  overflow: auto;
  border: 2px solid #B8D8C5;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  min-width: max-content;
  font-family: 'Segoe UI', Calibri, Arial, sans-serif;
}

.excel-table th,
.excel-table td {
  border: 1px solid #e0e0e0;
  padding: 0;
  text-align: center;
}

.excel-table thead th {
  background: linear-gradient(180deg, #2E7D5B 0%, #3A8E6A 100%);
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 8px 6px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.15);
  border-color: #256B4D;
}

.col-trabajador {
  text-align: left !important;
  min-width: 180px;
  max-width: 220px;
  background: #fafafa;
  padding: 8px 10px !important;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 5;
  background: #fafafa;
  border-right: 3px solid #B8D8C5 !important;
  box-shadow: 2px 0 4px rgba(0,0,0,0.08);
}

thead .sticky-col {
  z-index: 15;
  background: linear-gradient(180deg, #3A8E6A 0%, #256B4D 100%) !important;
}

.col-dia {
  min-width: 65px;
  max-width: 75px;
}

.col-sabado {
  background: #fcfcfc !important;
}

.col-sabado.col-dia {
  background: linear-gradient(180deg, #e0e0e0 0%, #d5d5d5 100%) !important;
}

.col-sabado.col-dia .dia-nombre,
.col-sabado.col-dia .dia-numero {
  color: #000 !important;
}

.col-sabado .celda-horas-parte {
  background: #fcfcfc;
  color: #000;
}

.col-sabado .celda-norma-parte {
  background: #fcfcfc;
  color: #000;
}

.col-sabado .valor-display,
.col-sabado .valor-display.norma {
  color: #000;
}

.col-sabado.celda-total-dia {
  background: #fafafa !important;
  color: #000;
}

/* Estilos para columnas de domingo (horas extras) */
.col-domingo {
  background: #fff3e0 !important;
}

.col-domingo.col-dia {
  background: linear-gradient(180deg, #ff9800 0%, #e65100 100%) !important;
}

.col-domingo.col-dia .dia-nombre,
.col-domingo.col-dia .dia-numero {
  color: #fff !important;
}

.col-domingo .celda-horas-parte {
  background: #fff3e0;
  color: #e65100;
}

.col-domingo .celda-norma-parte {
  background: #fff3e0;
  color: #e65100;
}

.col-domingo .valor-display,
.col-domingo .valor-display.norma {
  color: #e65100;
}

.col-domingo.celda-total-dia {
  background: #ffe0b2 !important;
  color: #e65100;
}

.dia-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
  padding: 4px 0;
}

.dia-nombre {
  font-size: 0.65em;
  color: rgba(255,255,255,0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dia-numero {
  font-size: 1.1em;
  font-weight: 700;
  color: white;
}

.dia-labels {
  display: flex;
  gap: 3px;
  margin-top: 3px;
}

.label-h, .label-n {
  font-size: 0.55em;
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 700;
  text-shadow: none;
}

.label-h {
  background: rgba(255,255,255,0.95);
  color: #546e7a;
}

.label-n {
  background: rgba(255,245,230,0.95);
  color: #8d6e63;
}

.btn-eliminar-dia {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.btn-aplicar-horas-columna {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #1D5A3F;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

th:hover .btn-eliminar-dia,
th:hover .btn-aplicar-horas-columna,
.btn-aplicar-horas-columna:focus-visible {
  opacity: 1;
}

.btn-aplicar-horas-columna:hover:not(:disabled) {
  background: #fff;
  transform: scale(1.12);
}

.btn-aplicar-horas-columna:disabled {
  cursor: not-allowed;
}

.col-total {
  min-width: 70px;
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%) !important;
  font-weight: 700;
  border-left: 3px solid #B8D8C5 !important;
  color: #1D5A3F;
  font-size: 1.05em;
  padding: 8px !important;
}

thead .col-total {
  background: linear-gradient(180deg, #3A8E6A 0%, #256B4D 100%) !important;
  color: white;
}

.trabajador-info {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 2px 0;
}

.trabajador-nombre {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.88em;
  color: #1D5A3F;
}

.trabajador-cargo {
  font-size: 0.7em;
  color: #3A8E6A;
  font-style: italic;
}

.btn-eliminar-trabajador {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-trabajador:hover .btn-eliminar-trabajador {
  opacity: 1;
}

.btn-eliminar-trabajador:hover {
  background: #c0392b;
}

.celda-datos {
  font-weight: 500;
  transition: all 0.15s;
  position: relative;
  padding: 0 !important;
}

.celda-split {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.celda-horas-parte,
.celda-norma-parte {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  padding: 5px 6px;
  min-height: 24px;
}

.celda-horas-parte {
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.celda-norma-parte {
  background: #fff;
}

.celda-horas-parte:hover {
  background: #E3F0E8;
  box-shadow: inset 0 0 0 1px #B8D8C5;
}

.celda-norma-parte:hover {
  background: #f1f8e9;
  box-shadow: inset 0 0 0 1px #aed581;
}

.celda-horas-parte.editando,
.celda-norma-parte.editando {
  background: #fff;
  box-shadow: inset 0 0 0 2px #2E7D5B;
}

.valor-display {
  font-size: 1em;
  font-weight: 600;
}

.valor-display.norma {
  font-size: 0.85em;
  color: #666;
  font-weight: 500;
}

.input-celda {
  width: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 1em;
  font-weight: 600;
  color: #1D5A3F;
  outline: none;
  padding: 0;
}

.input-celda::-webkit-inner-spin-button,
.input-celda::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.celda-vacia-add {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 40px;
  cursor: pointer;
  transition: background 0.15s;
}

.celda-vacia-add:hover {
  background: #E3F0E8;
}

.add-icon {
  font-size: 1.2em;
  color: #bbb;
  font-weight: bold;
}

.celda-vacia-add:hover .add-icon {
  color: #3A8E6A;
}

.btn-eliminar-celda {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.celda-datos:hover .btn-eliminar-celda {
  opacity: 1;
}

.btn-eliminar-celda:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.celda-vacia {
  background: #fafafa;
}

.celda-guardando {
  opacity: 0.6;
  pointer-events: none;
}

.input-horas {
  width: 100%;
  height: 100%;
  min-height: 26px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 1em;
  font-weight: 600;
  color: #1D5A3F;
  outline: none;
}

.input-horas::-webkit-inner-spin-button,
.input-horas::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.celda-horas-parte.horas-alto {
  background: linear-gradient(180deg, #ffebee 0%, #ffcdd2 100%);
}
.celda-horas-parte.horas-alto .valor-display {
  color: #c62828;
  font-weight: 700;
}

.celda-horas-parte.horas-normal {
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%);
}
.celda-horas-parte.horas-normal .valor-display {
  color: #1D5A3F;
  font-weight: 600;
}

.celda-horas-parte.horas-bajo {
  background: linear-gradient(180deg, #fff8e1 0%, #ffecb3 100%);
}
.celda-horas-parte.horas-bajo .valor-display {
  color: #f57c00;
  font-weight: 600;
}

.celda-horas-parte.celda-vacia {
  background: #f8f8f8;
}

.sin-datos {
  color: #ccc;
}

.sin-datos.celda-editable {
  color: #bbb;
  font-size: 1.2em;
  font-weight: bold;
}

.celda-vacia:hover .celda-editable {
  color: #3A8E6A;
}

.celda-total {
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%);
  font-weight: 700;
  color: #1D5A3F;
  font-size: 1em;
}

.fila-total td {
  font-weight: 700;
  border-top: 3px solid #2E7D5B;
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%);
  padding: 10px 8px !important;
  color: #1D5A3F;
}

.fila-total .sticky-col {
  background: linear-gradient(180deg, #B8D8C5 0%, #B8D8C5 100%);
}

.celda-total-dia {
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%) !important;
  color: #1D5A3F;
  font-size: 1em;
}

.celda-gran-total {
  background: linear-gradient(180deg, #3A8E6A 0%, #256B4D 100%) !important;
  color: white !important;
  font-size: 1.1em !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.sin-datos-mensaje {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px;
  color: #666;
  text-align: center;
  gap: 15px;
}

.leyenda {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 12px;
  font-size: 0.8em;
  color: #555;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.leyenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.leyenda-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.leyenda-color.alto { background: linear-gradient(180deg, #ffebee 0%, #ffcdd2 100%); }
.leyenda-color.normal { background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%); }
.leyenda-color.bajo { background: linear-gradient(180deg, #fff8e1 0%, #ffecb3 100%); }

/* ==================== MODALES ==================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-trabajador {
  max-width: 500px;
}

.modal-horas-columna {
  max-width: 420px;
}

.texto-modal-horas {
  margin: 0 0 18px;
  color: #555;
  line-height: 1.5;
  font-size: 0.92em;
}

.dias-mini-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  max-height: 100px;
  overflow-y: auto;
}

.dia-mini-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
  min-width: 45px;
}

.dia-mini-checkbox:hover {
  border-color: #2E7D5B;
  background: #f1f8e9;
}

.dia-mini-checkbox.seleccionado {
  border-color: #3A8E6A;
  background: #E3F0E8;
}

.dia-mini-num {
  font-size: 1em;
  font-weight: 700;
  color: #333;
}

.dia-mini-nombre {
  font-size: 0.6em;
  color: #888;
  text-transform: uppercase;
}

.modal-dias {
  max-width: 500px;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

.dia-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
  position: relative;
}

.dia-checkbox:hover:not(.disabled) {
  border-color: #2E7D5B;
  background: #f1f8e9;
}

.dia-checkbox.seleccionado {
  border-color: #3A8E6A;
  background: #E3F0E8;
}

.dia-checkbox.existente {
  background: #f5f5f5;
  border-color: #ddd;
  cursor: not-allowed;
  opacity: 0.6;
}

.dia-checkbox.domingo {
  background: #fff0f0;
  border-color: #ffcccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.dia-checkbox.domingo .dia-num {
  color: #e74c3c;
}

.dia-checkbox.domingo-habilitado {
  background: #fff3e0;
  border-color: #ffb74d;
  cursor: pointer;
  opacity: 1;
}

.dia-checkbox.domingo-habilitado:hover {
  border-color: #ff9800;
  background: #ffe0b2;
}

.dia-checkbox.domingo-habilitado.seleccionado {
  border-color: #ff9800;
  background: #ffe0b2;
}

.dia-checkbox.domingo-habilitado .dia-num {
  color: #e65100;
}

.dia-num {
  font-size: 1.1em;
  font-weight: 700;
  color: #333;
}

.dia-nombre-corto {
  font-size: 0.65em;
  color: #888;
  text-transform: uppercase;
}

.dia-existe-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.5em;
  background: #27ae60;
  color: white;
  padding: 1px 3px;
  border-radius: 3px;
}

.dia-extra-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.5em;
  background: #ff9800;
  color: white;
  padding: 1px 3px;
  border-radius: 3px;
}

.checkbox-horas-extras {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 5px;
  font-size: 0.85em;
  font-weight: 600;
  color: #e65100;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-horas-extras:hover {
  background: #ffe0b2;
}

.checkbox-horas-extras input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #ff9800;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #333;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.btn-cerrar-modal:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.seleccion-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.btn-seleccionar-todos,
.btn-desmarcar-todos {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-seleccionar-todos {
  background: #2E7D5B;
  color: white;
}

.btn-seleccionar-todos:hover {
  background: #256B4D;
}

.btn-desmarcar-todos {
  background: #e0e0e0;
  color: #555;
}

.btn-desmarcar-todos:hover {
  background: #d0d0d0;
}

.dias-contador {
  margin-left: auto;
  font-size: 0.85em;
  color: #1D5A3F;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 0.85em;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

.input-fecha,
.input-select,
.input-buscar,
.input-numero {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
  transition: border-color 0.2s;
}

.input-fecha:focus,
.input-select:focus,
.input-buscar:focus,
.input-numero:focus {
  outline: none;
  border-color: #2E7D5B;
}

.form-inline {
  display: flex;
  gap: 15px;
}

.form-inline > div {
  flex: 1;
}

.lista-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px 6px 0 0;
  border: 1px solid #ddd;
  border-bottom: none;
  font-size: 0.85em;
}

.info-listado {
  color: #555;
  font-weight: 500;
}

.info-seleccionados {
  color: #1D5A3F;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lista-trabajadores {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 0 0 6px 6px;
  margin-bottom: 15px;
}

.trabajador-item {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
}

.trabajador-item:last-child {
  border-bottom: none;
}

.trabajador-item:hover {
  background: #f5f5f5;
}

.trabajador-item.seleccionado {
  background: #E3F0E8;
  border-left: 3px solid #3A8E6A;
}

.trabajador-item .nombre {
  font-weight: 500;
}

.trabajador-item .ruc {
  color: #888;
  font-size: 0.85em;
}

.no-resultados {
  padding: 20px;
  text-align: center;
  color: #888;
}

.info-rango {
  padding: 10px 12px;
  background: #E3F0E8;
  border-radius: 6px;
  text-align: center;
  color: #1D5A3F;
  font-size: 0.9em;
  margin-top: -5px;
}

.seleccion-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #E3F0E8;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 0.85em;
  color: #1D5A3F;
}

.btn-limpiar {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.85em;
  text-decoration: underline;
}

.checkbox-trabajador {
  margin-right: 10px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn-cancelar,
.btn-guardar {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancelar {
  background: #e0e0e0;
  color: #333;
}

.btn-cancelar:hover {
  background: #d0d0d0;
}

.btn-guardar {
  background: #3A8E6A;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background: #256B4D;
}

.btn-guardar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .acciones-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .resumen {
    justify-content: space-around;
  }

  .botones-acciones {
    justify-content: center;
  }

  .col-trabajador {
    min-width: 100px;
  }

  .col-dia {
    min-width: 45px;
  }

  .excel-table {
    font-size: 0.75em;
  }
}
</style>
