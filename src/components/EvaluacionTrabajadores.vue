<!-- src/components/EvaluacionTrabajadores.vue -->
<template>
  <div class="evaluacion-trabajadores">
    <h2>📋 Evaluación de Trabajadores</h2>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: tabActiva === tab.id }]"
        @click="tabActiva = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Ver Evaluaciones por Período -->
    <div v-if="tabActiva === 'ver'" class="tab-content">
      <div class="filtros">
        <div class="filtro-grupo">
          <label>Año</label>
          <select v-model="yearSeleccionado" class="filtro-select" @change="cargarEvaluacionesPorPeriodo">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="filtro-grupo">
          <label>Mes</label>
          <select v-model="mesSeleccionado" class="filtro-select" @change="cargarEvaluacionesPorPeriodo">
            <option v-for="m in meses" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button @click="cargarEvaluacionesPorPeriodo" class="btn-cargar" :disabled="isLoading">
          {{ isLoading ? 'Cargando...' : '🔄 Cargar' }}
        </button>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Cargando evaluaciones...</p>
      </div>

      <div v-else-if="evaluacionesPeriodo.length > 0" class="tabla-contenedor">
        <div class="resumen-bar">
          <span>📊 Total: <strong>{{ evaluacionesPeriodo.length }}</strong> evaluaciones</span>
        </div>
        <table class="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Trabajador</th>
              <th>RUC</th>
              <th>Cargo</th>
              <th>Calificación</th>
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, idx) in evaluacionesPeriodo" :key="e.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ e.trabajadorNombre }}</td>
              <td>{{ e.trabajadorRuc || '-' }}</td>
              <td>{{ e.trabajadorCargo || '-' }}</td>
              <td>
                <span :class="['badge-cal', getBadgeClass(e.calificacion)]">
                  {{ getCalificacionTexto(e.calificacion) }}
                </span>
              </td>
              <td class="comentarios-cell">{{ e.comentarios || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="sin-datos">
        <span class="empty-icon">📋</span>
        <p>No hay evaluaciones para {{ mesSeleccionado }} {{ yearSeleccionado }}</p>
      </div>
    </div>

    <!-- Tab: Evaluar Trabajadores -->
    <div v-if="tabActiva === 'evaluar'" class="tab-content">
      <div class="filtros">
        <div class="filtro-grupo">
          <label>Año</label>
          <select v-model="yearEvaluar" class="filtro-select">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="filtro-grupo">
          <label>Mes</label>
          <select v-model="mesEvaluar" class="filtro-select">
            <option v-for="m in meses" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button @click="cargarTrabajadoresParaEvaluar" class="btn-cargar" :disabled="isLoadingTrabajadores">
          {{ isLoadingTrabajadores ? 'Cargando...' : '🔄 Cargar Trabajadores' }}
        </button>
        <button
          @click="guardarEvaluaciones"
          class="btn-guardar"
          :disabled="!hayEvaluacionesPendientes || isGuardando"
        >
          {{ isGuardando ? 'Guardando...' : '💾 Guardar Evaluaciones' }}
        </button>
      </div>

      <!-- Info de criterios -->
      <div v-if="propuestosDeficiente.length > 0" class="info-propuestos">
        <div class="info-header">
          <span class="info-icon">⚠️</span>
          <strong>{{ propuestosDeficiente.length }} trabajadores propuestos a Deficiente</strong>
          <span class="info-criterios">(≥20% ausencias, ≥20% &lt;8h, o ≥30% combinado)</span>
        </div>
      </div>

      <div v-if="isLoadingTrabajadores" class="loading">
        <div class="spinner"></div>
        <p>Cargando trabajadores y analizando propuestas...</p>
      </div>

      <div v-else-if="trabajadoresParaEvaluar.length > 0" class="tabla-contenedor">
        <div class="resumen-bar">
          <span>👥 Total: <strong>{{ trabajadoresParaEvaluar.length }}</strong></span>
          <span>✏️ Existentes: <strong class="text-info">{{ evaluacionesExistentesIds.size }}</strong></span>
          <span>⚠️ Propuestos Def.: <strong class="text-danger">{{ propuestosDeficiente.length }}</strong></span>
          <span>🚫 Excluidos: <strong class="text-warning">{{ cantidadExcluidos }}</strong></span>
          <span>✅ A evaluar: <strong class="text-success">{{ trabajadoresParaEvaluar.length - cantidadExcluidos }}</strong></span>
        </div>

        <!-- Tabla agrupada por grupos -->
        <div v-for="grupo in trabajadoresAgrupadosParaEvaluar" :key="grupo.nombre" class="grupo-section">
          <div class="grupo-header">
            <span class="grupo-icon">👥</span>
            <span class="grupo-nombre">{{ grupo.nombre }}</span>
            <span class="grupo-count">{{ grupo.trabajadores.length }} trabajadores</span>
          </div>
          <table class="tabla tabla-evaluar tabla-grupo">
            <thead>
              <tr>
                <th class="col-excluir">Excluir</th>
                <th>#</th>
                <th>Trabajador</th>
                <th>RUC</th>
                <th>Propuesta</th>
                <th>Calificación</th>
                <th>Comentarios</th>
                <th class="col-firma">Firma</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(t, idx) in grupo.trabajadores"
                :key="t.id"
                :class="{ 'row-excluido': exclusiones[t.id]?.excluido, 'row-propuesto': esPropuestoDeficiente(t.id) }"
              >
                <td class="col-excluir">
                  <div class="exclusion-control">
                    <input
                      type="checkbox"
                      :id="'excluir-' + t.id"
                      :checked="exclusiones[t.id]?.excluido"
                      @change="toggleExclusion(t.id)"
                      class="checkbox-excluir"
                    />
                    <select
                      v-if="exclusiones[t.id]?.excluido"
                      v-model="exclusiones[t.id].motivo"
                      class="select-motivo"
                    >
                      <option v-for="m in motivosExclusion" :key="m.value" :value="m.value">
                        {{ m.label }}
                      </option>
                    </select>
                  </div>
                </td>
                <td>{{ idx + 1 }}</td>
                <td class="celda-trabajador">
                  <span class="nombre-trabajador">
                    {{ t.nombre }}
                    <span v-if="tieneEvaluacionExistente(t.id)" class="badge-existente" title="Evaluación existente - se actualizará">
                      ✏️
                    </span>
                    <span v-if="esPropuestoDeficiente(t.id)" class="badge-propuesto" :title="getPropuestoInfo(t.id)?.motivo">
                      ⚠️
                    </span>
                  </span>
                  <span v-if="t.cargo" class="cargo-trabajador">{{ t.cargo }}</span>
                </td>
                <td>{{ t.ruc || '-' }}</td>
                <td>
                  <span v-if="esPropuestoDeficiente(t.id)" class="propuesta-info">
                    <span class="badge-cal deficiente">{{ getPropuestoInfo(t.id)?.motivo }}</span>
                  </span>
                  <span v-else class="propuesta-ok">✓ OK</span>
                </td>
                <td>
                  <div v-if="!exclusiones[t.id]?.excluido" class="calificacion-btns">
                    <button
                      v-for="opcion in calificacionesOpciones"
                      :key="opcion.valor"
                      :class="['cal-btn', opcion.clase, { active: evaluacionesNuevas[t.id]?.calificacion === opcion.valor }]"
                      @click="setCalificacion(t.id, opcion.valor)"
                    >
                      {{ opcion.valor }}
                    </button>
                  </div>
                  <span v-else class="excluido-label">— Excluido —</span>
                </td>
                <td>
                  <input
                    v-if="!exclusiones[t.id]?.excluido"
                    type="text"
                    v-model="evaluacionesNuevas[t.id].comentarios"
                    placeholder="Comentarios..."
                    class="input-comentario"
                  />
                  <span v-else class="motivo-exclusion">{{ exclusiones[t.id]?.motivo || '-' }}</span>
                </td>
                <td class="col-firma"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="sin-datos">
        <span class="empty-icon">👥</span>
        <p>Presiona "Cargar Trabajadores" para comenzar a evaluar</p>
      </div>
    </div>

    <!-- Tab: Consolidado Mensual -->
    <div v-if="tabActiva === 'mensual'" class="tab-content">
      <div class="filtros">
        <div class="filtro-grupo">
          <label>Año</label>
          <select v-model="yearConsolidado" class="filtro-select">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="filtro-grupo">
          <label>Mes</label>
          <select v-model="mesConsolidado" class="filtro-select">
            <option v-for="m in meses" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button @click="cargarConsolidadoMensual" class="btn-cargar" :disabled="isLoadingConsolidado">
          {{ isLoadingConsolidado ? 'Cargando...' : '🔄 Cargar Consolidado' }}
        </button>
        <button
          @click="exportarPdfMensual"
          class="btn-pdf"
          :disabled="!consolidadoMensual || consolidadoMensual.data.length === 0"
        >
          📄 Exportar PDF
        </button>
      </div>

      <div v-if="isLoadingConsolidado" class="loading">
        <div class="spinner"></div>
        <p>Cargando consolidado...</p>
      </div>

      <div v-else-if="consolidadoMensual && consolidadoMensual.data.length > 0" class="consolidado-content">
        <div class="stats-cards">
          <div class="stat-card">
            <span class="stat-value">{{ consolidadoMensual.total }}</span>
            <span class="stat-label">Evaluados</span>
          </div>
          <div class="stat-card promedio">
            <span class="stat-value">{{ consolidadoMensual.promedioGeneral }}</span>
            <span class="stat-label">Promedio</span>
          </div>
          <div class="stat-card superior">
            <span class="stat-value">{{ consolidadoMensual.superiores }}</span>
            <span class="stat-label">Superiores (4-5)</span>
          </div>
          <div class="stat-card adecuado">
            <span class="stat-value">{{ consolidadoMensual.adecuados }}</span>
            <span class="stat-label">Adecuados (3)</span>
          </div>
          <div class="stat-card deficiente">
            <span class="stat-value">{{ consolidadoMensual.deficientes }}</span>
            <span class="stat-label">Deficientes (1-2)</span>
          </div>
        </div>

        <!-- Tabla agrupada por grupos -->
        <div v-for="grupo in consolidadoMensualAgrupado" :key="grupo.nombre" class="grupo-section">
          <div class="grupo-header">
            <span class="grupo-icon">👥</span>
            <span class="grupo-nombre">{{ grupo.nombre }}</span>
            <span class="grupo-count">{{ grupo.trabajadores.length }} trabajadores</span>
          </div>
          <table class="tabla tabla-grupo">
            <thead>
              <tr>
                <th>#</th>
                <th>Trabajador</th>
                <th>RUC</th>
                <th>Calificación</th>
                <th>Comentarios</th>
                <th class="col-firma">Firma</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in grupo.trabajadores" :key="item.trabajadorId">
                <td>{{ idx + 1 }}</td>
                <td class="celda-trabajador">
                  <span class="nombre-trabajador">{{ item.trabajadorNombre }}</span>
                  <span v-if="item.trabajadorCargo" class="cargo-trabajador">{{ item.trabajadorCargo }}</span>
                </td>
                <td>{{ item.trabajadorRuc || '-' }}</td>
                <td>
                  <span :class="['badge-cal', getBadgeClass(item.calificacion)]">
                    {{ getCalificacionTexto(item.calificacion) }}
                  </span>
                </td>
                <td class="comentarios-cell">{{ item.comentarios || '-' }}</td>
                <td class="col-firma"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="sin-datos">
        <span class="empty-icon">📊</span>
        <p>Selecciona mes y año para ver el consolidado</p>
      </div>
    </div>

    <!-- Tab: Consolidado Trimestral -->
    <div v-if="tabActiva === 'trimestral'" class="tab-content">
      <div class="filtros">
        <div class="filtro-grupo">
          <label>Año</label>
          <select v-model="yearTrimestral" class="filtro-select">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="filtro-grupo">
          <label>Mes Inicio</label>
          <select v-model="mesInicioTrimestral" class="filtro-select">
            <option v-for="m in meses" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="filtro-grupo">
          <label>Mes Fin</label>
          <select v-model="mesFinTrimestral" class="filtro-select">
            <option v-for="m in meses" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button @click="cargarConsolidadoTrimestral" class="btn-cargar" :disabled="isLoadingTrimestral">
          {{ isLoadingTrimestral ? 'Cargando...' : '🔄 Cargar' }}
        </button>
        <button
          @click="exportarPdfTrimestral"
          class="btn-pdf"
          :disabled="!consolidadoTrimestral || consolidadoTrimestral.data.length === 0"
        >
          📄 Exportar PDF
        </button>
      </div>

      <div v-if="isLoadingTrimestral" class="loading">
        <div class="spinner"></div>
        <p>Cargando consolidado trimestral...</p>
      </div>

      <div v-else-if="consolidadoTrimestral && consolidadoTrimestral.data.length > 0" class="consolidado-content">
        <!-- Info de criterio -->
        <div class="info-criterio">
          <span class="info-icon">📋</span>
          <strong>Criterio:</strong> 2 o más meses con Deficiente = <span class="text-danger">DEFICIENTE</span>,
          caso contrario = <span class="text-success">ACEPTABLE</span>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <span class="stat-value">{{ statsTrimestral.total }}</span>
            <span class="stat-label">Evaluados</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ consolidadoTrimestral.meses.length }}</span>
            <span class="stat-label">Meses</span>
          </div>
          <div class="stat-card aceptable">
            <span class="stat-value">{{ statsTrimestral.aceptables }}</span>
            <span class="stat-label">Aceptables</span>
          </div>
          <div class="stat-card deficiente">
            <span class="stat-value">{{ statsTrimestral.deficientes }}</span>
            <span class="stat-label">Deficientes</span>
          </div>
          <div class="stat-card promedio">
            <span class="stat-value">{{ ((statsTrimestral.aceptables / statsTrimestral.total) * 100).toFixed(0) }}%</span>
            <span class="stat-label">% Aceptables</span>
          </div>
        </div>

        <!-- Tabla agrupada por grupos -->
        <div v-for="grupo in consolidadoTrimestralAgrupado" :key="grupo.nombre" class="grupo-section">
          <div class="grupo-header">
            <span class="grupo-icon">👥</span>
            <span class="grupo-nombre">{{ grupo.nombre }}</span>
            <span class="grupo-count">{{ grupo.trabajadores.length }} trabajadores</span>
          </div>
          <table class="tabla tabla-trimestral tabla-grupo">
            <thead>
              <tr>
                <th>#</th>
                <th>Trabajador</th>
                <th v-for="m in consolidadoTrimestral.meses" :key="m" class="col-mes">{{ m.substring(0, 3) }}</th>
                <th class="col-contador">Def.</th>
                <th class="col-resultado">Resultado</th>
                <th class="col-firma">Firma</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in grupo.trabajadores"
                :key="item.trabajadorId"
                :class="{ 'row-deficiente-final': contarMesesDeficientes(item.calificacionesPorMes) >= 2 }"
              >
                <td>{{ idx + 1 }}</td>
                <td class="celda-trabajador">
                  <span class="nombre-trabajador">{{ item.trabajadorNombre }}</span>
                  <span v-if="item.trabajadorCargo" class="cargo-trabajador">{{ item.trabajadorCargo }}</span>
                </td>
                <td v-for="m in consolidadoTrimestral.meses" :key="m" class="col-mes">
                  <span v-if="item.calificacionesPorMes[m]" :class="['badge-mini', getBadgeClass(item.calificacionesPorMes[m])]">
                    {{ getCalificacionTexto(item.calificacionesPorMes[m]).charAt(0) }}
                  </span>
                  <span v-else class="sin-eval">-</span>
                </td>
                <td class="col-contador">
                  <span :class="['contador-def', contarMesesDeficientes(item.calificacionesPorMes) >= 2 ? 'alerta' : '']">
                    {{ contarMesesDeficientes(item.calificacionesPorMes) }}/{{ contarMesesEvaluados(item.calificacionesPorMes) }}
                  </span>
                </td>
                <td class="col-resultado">
                  <span :class="['badge-resultado', getResultadoTrimestralClass(item.calificacionesPorMes)]">
                    {{ getResultadoTrimestral(item.calificacionesPorMes) }}
                  </span>
                </td>
                <td class="col-firma"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Leyenda -->
        <div class="leyenda-trimestral">
          <span><strong>S</strong> = Superior</span>
          <span><strong>A</strong> = Adecuado</span>
          <span><strong>D</strong> = Deficiente</span>
          <span class="separador">|</span>
          <span><strong>Def.</strong> = Meses deficientes / Meses evaluados</span>
        </div>
      </div>

      <div v-else class="sin-datos">
        <span class="empty-icon">📈</span>
        <p>Selecciona el rango de meses para ver el consolidado</p>
      </div>
    </div>

    <!-- Mensaje de éxito/error -->
    <transition name="fade">
      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import EvaluacionService, {
  type EvaluacionPorPeriodo,
  type ConsolidadoMensual,
  type ConsolidadoMensualItem,
  type ConsolidadoTrimestral,
  type ConsolidadoTrimestralItem,
  type TrabajadorParaEvaluar
} from '@/services/EvaluacionService'
import ReporteConsolidadoService from '@/services/ReporteConsolidadoService'
import type { TrabajadorConsolidado } from '@/types/ReporteConsolidado'

// Interface para propuestos a deficiente
interface PropuestoDeficiente {
  trabajadorId: string
  nombre: string
  motivo: string
  porcentajeAusencias: number
  porcentajeMenor8: number
  porcentajeTotal: number
}

// Motivos de exclusión
const motivosExclusion = [
  { value: '', label: 'Seleccionar...' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'certificado', label: 'Certificado médico' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'baja', label: 'Baja temporal' },
  { value: 'otro', label: 'Otro' }
]

// Tabs
const tabs = [
  { id: 'ver', label: 'Ver Evaluaciones', icon: '📋' },
  { id: 'evaluar', label: 'Evaluar', icon: '✏️' },
  { id: 'mensual', label: 'Consolidado Mensual', icon: '📊' },
  { id: 'trimestral', label: 'Consolidado Trimestral', icon: '📈' }
]
const tabActiva = ref('ver')

// Common
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const currentYear = new Date().getFullYear()
const years = computed(() => {
  const list = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    list.push(i)
  }
  return list
})

const mensaje = ref({ texto: '', tipo: 'exito' })

const showMensaje = (texto: string, tipo: 'exito' | 'error') => {
  mensaje.value = { texto, tipo }
  setTimeout(() => {
    mensaje.value = { texto: '', tipo: 'exito' }
  }, 4000)
}

const getBadgeClass = (cal: number | string) => {
  if (typeof cal === 'string') {
    return cal.toLowerCase()
  }
  if (cal >= 4) return 'superior'
  if (cal === 3) return 'adecuado'
  return 'deficiente'
}

const getCalificacionTexto = (cal: number | string): string => {
  if (typeof cal === 'string') return cal
  if (cal >= 4) return 'Superior'
  if (cal === 3) return 'Adecuado'
  return 'Deficiente'
}

const calificacionesOpciones = [
  { valor: 'Deficiente', clase: 'deficiente' },
  { valor: 'Adecuado', clase: 'adecuado' },
  { valor: 'Superior', clase: 'superior' }
]

const calificacionTextoANumero = (texto: string): number => {
  switch (texto) {
    case 'Superior': return 5
    case 'Adecuado': return 3
    case 'Deficiente': return 1
    default: return 0
  }
}

// === LÓGICA CONSOLIDADO TRIMESTRAL ===
// Regla: 2+ meses deficiente = DEFICIENTE, sino = ACEPTABLE

// Contar meses deficientes de un trabajador
const contarMesesDeficientes = (calificacionesPorMes: Record<string, number>): number => {
  return Object.values(calificacionesPorMes).filter(cal => cal <= 2).length
}

// Contar meses con evaluación
const contarMesesEvaluados = (calificacionesPorMes: Record<string, number>): number => {
  return Object.values(calificacionesPorMes).filter(cal => cal > 0).length
}

// Determinar resultado final trimestral
const getResultadoTrimestral = (calificacionesPorMes: Record<string, number>): string => {
  const deficientes = contarMesesDeficientes(calificacionesPorMes)
  return deficientes >= 2 ? 'Deficiente' : 'Aceptable'
}

// Clase CSS para resultado trimestral
const getResultadoTrimestralClass = (calificacionesPorMes: Record<string, number>): string => {
  const deficientes = contarMesesDeficientes(calificacionesPorMes)
  return deficientes >= 2 ? 'deficiente' : 'aceptable'
}

// Estadísticas del consolidado trimestral
const statsTrimestral = computed(() => {
  if (!consolidadoTrimestral.value) return { aceptables: 0, deficientes: 0, total: 0 }

  let aceptables = 0
  let deficientes = 0

  for (const item of consolidadoTrimestral.value.data) {
    const mesesDef = contarMesesDeficientes(item.calificacionesPorMes)
    if (mesesDef >= 2) {
      deficientes++
    } else {
      aceptables++
    }
  }

  return {
    aceptables,
    deficientes,
    total: aceptables + deficientes
  }
})

// Tab: Ver Evaluaciones
const yearSeleccionado = ref(currentYear)
const mesSeleccionado = ref(meses[new Date().getMonth()])
const isLoading = ref(false)
const evaluacionesPeriodo = ref<EvaluacionPorPeriodo[]>([])

const cargarEvaluacionesPorPeriodo = async () => {
  isLoading.value = true
  try {
    const response = await EvaluacionService.getByPeriodo(mesSeleccionado.value, yearSeleccionado.value)
    evaluacionesPeriodo.value = response.data.data || []
  } catch (error) {
    console.error('Error:', error)
    evaluacionesPeriodo.value = []
    showMensaje('Error al cargar evaluaciones', 'error')
  } finally {
    isLoading.value = false
  }
}

// Tab: Evaluar Trabajadores
const yearEvaluar = ref(currentYear)
const mesEvaluar = ref(meses[new Date().getMonth()])
const isLoadingTrabajadores = ref(false)
const isGuardando = ref(false)
const trabajadoresParaEvaluar = ref<TrabajadorParaEvaluar[]>([])
const evaluacionesNuevas = reactive<Record<string, { calificacion: string | number; comentarios: string }>>({})

// Propuestos a deficiente y exclusiones
const propuestosDeficiente = ref<PropuestoDeficiente[]>([])
const exclusiones = reactive<Record<string, { excluido: boolean; motivo: string }>>({})
// Rastrear evaluaciones existentes (para indicador visual)
const evaluacionesExistentesIds = ref<Set<string>>(new Set())
const UMBRAL_PORCENTAJE = 20
const UMBRAL_COMBINADO = 30

const cargarTrabajadoresParaEvaluar = async () => {
  isLoadingTrabajadores.value = true
  try {
    // Cargar trabajadores
    const response = await EvaluacionService.getTrabajadoresParaEvaluar()
    trabajadoresParaEvaluar.value = response.data.data || []

    // Cargar evaluaciones existentes para este período
    const evaluacionesExistentesResponse = await EvaluacionService.getByPeriodo(
      mesEvaluar.value,
      yearEvaluar.value
    )
    const evaluacionesExistentes = evaluacionesExistentesResponse.data.data || []

    // Crear mapa de evaluaciones existentes por trabajadorId
    const evaluacionesMap: Record<string, { calificacion: number; comentarios: string }> = {}
    evaluacionesExistentesIds.value = new Set()
    for (const e of evaluacionesExistentes) {
      evaluacionesMap[e.trabajadorId] = {
        calificacion: e.calificacion,
        comentarios: e.comentarios || ''
      }
      evaluacionesExistentesIds.value.add(e.trabajadorId)
    }

    // Cargar reporte consolidado para calcular propuestos a deficiente
    await calcularPropuestosDeficiente()

    // Initialize evaluation state - priorizar evaluaciones existentes
    for (const t of trabajadoresParaEvaluar.value) {
      const existente = evaluacionesMap[t.id]

      if (existente) {
        // Si existe evaluación previa, cargarla
        evaluacionesNuevas[t.id] = {
          calificacion: getCalificacionTexto(existente.calificacion),
          comentarios: existente.comentarios
        }
      } else {
        // Si no existe, usar propuesta o default
        const propuesto = propuestosDeficiente.value.find(p => p.trabajadorId === t.id)
        evaluacionesNuevas[t.id] = {
          calificacion: propuesto ? 'Deficiente' : 'Adecuado',
          comentarios: propuesto ? propuesto.motivo : ''
        }
      }

      // Inicializar exclusiones
      if (!exclusiones[t.id]) {
        exclusiones[t.id] = { excluido: false, motivo: '' }
      }
    }
  } catch (error) {
    console.error('Error:', error)
    trabajadoresParaEvaluar.value = []
    showMensaje('Error al cargar trabajadores', 'error')
  } finally {
    isLoadingTrabajadores.value = false
  }
}

// Calcular propuestos a deficiente basándose en el reporte consolidado
const calcularPropuestosDeficiente = async () => {
  try {
    const response = await ReporteConsolidadoService.obtenerReporteConsolidado(
      String(yearEvaluar.value),
      mesEvaluar.value
    )

    const trabajadoresConsolidado = response.data.trabajadores || []
    const propuestos: PropuestoDeficiente[] = []

    // Calcular días laborables del mes (lunes a viernes)
    const diasLaborables = calcularDiasLaborables(yearEvaluar.value, meses.indexOf(mesEvaluar.value))

    for (const t of trabajadoresConsolidado) {
      const { diasAusente, diasMenor8 } = analizarDiasTrabajador(t, diasLaborables)

      const porcentajeAusencias = (diasAusente / diasLaborables) * 100
      const porcentajeMenor8 = (diasMenor8 / diasLaborables) * 100
      const porcentajeTotal = porcentajeAusencias + porcentajeMenor8

      // Verificar criterios de deficiente
      if (porcentajeAusencias >= UMBRAL_PORCENTAJE ||
          porcentajeMenor8 >= UMBRAL_PORCENTAJE ||
          porcentajeTotal >= UMBRAL_COMBINADO) {

        let motivo = ''
        if (porcentajeAusencias >= UMBRAL_PORCENTAJE && porcentajeMenor8 >= UMBRAL_PORCENTAJE) {
          motivo = 'Ausentismo + Incumplimiento de jornada'
        } else if (porcentajeAusencias >= UMBRAL_PORCENTAJE) {
          motivo = 'Alto ausentismo'
        } else if (porcentajeMenor8 >= UMBRAL_PORCENTAJE) {
          motivo = 'Incumplimiento de jornada'
        } else {
          motivo = 'Problemas combinados'
        }

        propuestos.push({
          trabajadorId: t.trabajadorId,
          nombre: t.nombre,
          motivo,
          porcentajeAusencias,
          porcentajeMenor8,
          porcentajeTotal
        })
      }
    }

    propuestosDeficiente.value = propuestos
  } catch (error) {
    console.error('Error al cargar reporte consolidado:', error)
    propuestosDeficiente.value = []
  }
}

// Calcular días laborables (lunes a viernes) del mes
const calcularDiasLaborables = (year: number, mesIndex: number): number => {
  let count = 0
  const date = new Date(year, mesIndex, 1)
  while (date.getMonth() === mesIndex) {
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No sábado ni domingo
      count++
    }
    date.setDate(date.getDate() + 1)
  }
  return count
}

// Analizar días de un trabajador
const analizarDiasTrabajador = (t: TrabajadorConsolidado, diasLaborables: number) => {
  let diasAusente = 0
  let diasMenor8 = 0

  // Obtener días del mes que son laborables
  const year = yearEvaluar.value
  const mesIndex = meses.indexOf(mesEvaluar.value)

  for (let dia = 1; dia <= 31; dia++) {
    const fecha = new Date(year, mesIndex, dia)
    if (fecha.getMonth() !== mesIndex) break // Día fuera del mes

    const dayOfWeek = fecha.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // Saltar fines de semana

    const horasStr = t.horasPorDia[dia]
    const horas = horasStr ? parseFloat(horasStr) : 0

    if (horas === 0) {
      diasAusente++
    } else if (horas < 8) {
      diasMenor8++
    }
  }

  return { diasAusente, diasMenor8 }
}

// Verificar si un trabajador está propuesto a deficiente
const esPropuestoDeficiente = (trabajadorId: string): boolean => {
  return propuestosDeficiente.value.some(p => p.trabajadorId === trabajadorId)
}

// Verificar si existe evaluación previa
const tieneEvaluacionExistente = (trabajadorId: string): boolean => {
  return evaluacionesExistentesIds.value.has(trabajadorId)
}

// Obtener info de propuesto
const getPropuestoInfo = (trabajadorId: string): PropuestoDeficiente | undefined => {
  return propuestosDeficiente.value.find(p => p.trabajadorId === trabajadorId)
}

// Toggle exclusión
const toggleExclusion = (trabajadorId: string) => {
  if (!exclusiones[trabajadorId]) {
    exclusiones[trabajadorId] = { excluido: false, motivo: '' }
  }
  exclusiones[trabajadorId].excluido = !exclusiones[trabajadorId].excluido

  // Si se excluye, limpiar la calificación
  if (exclusiones[trabajadorId].excluido) {
    evaluacionesNuevas[trabajadorId].calificacion = ''
  }
}

// Trabajadores filtrados (sin excluidos)
const trabajadoresParaGuardar = computed(() => {
  return trabajadoresParaEvaluar.value.filter(t => !exclusiones[t.id]?.excluido)
})

// Computed: agrupar trabajadores para evaluar por grupo
const trabajadoresAgrupadosParaEvaluar = computed(() => {
  if (trabajadoresParaEvaluar.value.length === 0) {
    return []
  }

  // Agrupar por grupoNombre
  const grupos: Record<string, TrabajadorParaEvaluar[]> = {}

  for (const t of trabajadoresParaEvaluar.value) {
    const grupoKey = t.grupoNombre || 'Sin Grupo'
    if (!grupos[grupoKey]) {
      grupos[grupoKey] = []
    }
    grupos[grupoKey].push(t)
  }

  // Convertir a array ordenado (Sin Grupo al final)
  const gruposOrdenados = Object.keys(grupos).sort((a, b) => {
    if (a === 'Sin Grupo') return 1
    if (b === 'Sin Grupo') return -1
    return a.localeCompare(b)
  })

  return gruposOrdenados.map(nombre => ({
    nombre,
    trabajadores: grupos[nombre]
  }))
})

// Cantidad de excluidos
const cantidadExcluidos = computed(() => {
  return Object.values(exclusiones).filter(e => e.excluido).length
})

const setCalificacion = (trabajadorId: string, cal: string) => {
  if (!evaluacionesNuevas[trabajadorId]) {
    evaluacionesNuevas[trabajadorId] = { calificacion: '', comentarios: '' }
  }
  evaluacionesNuevas[trabajadorId].calificacion = cal
}

const cantidadEvaluados = computed(() => {
  return Object.values(evaluacionesNuevas).filter(e => e.calificacion !== '' && e.calificacion !== 0).length
})

const hayEvaluacionesPendientes = computed(() => cantidadEvaluados.value > 0)

const guardarEvaluaciones = async () => {
  isGuardando.value = true
  try {
    // Filtrar solo los no excluidos y con calificación
    const evaluacionesAGuardar = Object.entries(evaluacionesNuevas)
      .filter(([trabajadorId, e]) => {
        const noExcluido = !exclusiones[trabajadorId]?.excluido
        const tieneCalificacion = e.calificacion !== '' && e.calificacion !== 0
        return noExcluido && tieneCalificacion
      })
      .map(([trabajadorId, e]) => ({
        trabajadorId,
        calificacion: typeof e.calificacion === 'string' ? calificacionTextoANumero(e.calificacion) : e.calificacion,
        comentarios: e.comentarios
      }))

    if (evaluacionesAGuardar.length === 0) {
      showMensaje('No hay evaluaciones para guardar', 'error')
      return
    }

    const request = {
      mes: mesEvaluar.value,
      year: yearEvaluar.value,
      grupoId: null,
      jefeId: null,
      evaluaciones: evaluacionesAGuardar
    }

    await EvaluacionService.createBatch(request)
    showMensaje(`${evaluacionesAGuardar.length} evaluaciones guardadas (${cantidadExcluidos.value} excluidos)`, 'exito')

    // Reset
    for (const t of trabajadoresParaEvaluar.value) {
      evaluacionesNuevas[t.id] = { calificacion: '', comentarios: '' }
      exclusiones[t.id] = { excluido: false, motivo: '' }
    }
  } catch (error) {
    console.error('Error:', error)
    showMensaje('Error al guardar evaluaciones', 'error')
  } finally {
    isGuardando.value = false
  }
}

// Tab: Consolidado Mensual
const yearConsolidado = ref(currentYear)
const mesConsolidado = ref(meses[new Date().getMonth()])
const isLoadingConsolidado = ref(false)
const consolidadoMensual = ref<ConsolidadoMensual | null>(null)

// Computed: agrupar consolidado mensual por grupo
const consolidadoMensualAgrupado = computed(() => {
  if (!consolidadoMensual.value || consolidadoMensual.value.data.length === 0) {
    return []
  }

  // Agrupar por grupoNombre
  const grupos: Record<string, ConsolidadoMensualItem[]> = {}

  for (const item of consolidadoMensual.value.data) {
    const grupoKey = item.grupoNombre || 'Sin Grupo'
    if (!grupos[grupoKey]) {
      grupos[grupoKey] = []
    }
    grupos[grupoKey].push(item)
  }

  // Convertir a array ordenado (Sin Grupo al final)
  const gruposOrdenados = Object.keys(grupos).sort((a, b) => {
    if (a === 'Sin Grupo') return 1
    if (b === 'Sin Grupo') return -1
    return a.localeCompare(b)
  })

  return gruposOrdenados.map(nombre => ({
    nombre,
    trabajadores: grupos[nombre]
  }))
})

const cargarConsolidadoMensual = async () => {
  isLoadingConsolidado.value = true
  try {
    const response = await EvaluacionService.getConsolidadoMensual(mesConsolidado.value, yearConsolidado.value)
    consolidadoMensual.value = response.data
  } catch (error) {
    console.error('Error:', error)
    consolidadoMensual.value = null
    showMensaje('Error al cargar consolidado', 'error')
  } finally {
    isLoadingConsolidado.value = false
  }
}

const exportarPdfMensual = () => {
  if (!consolidadoMensual.value) return

  const html = generarHtmlPdfMensual()
  abrirVentanaImpresion(html)
}

const generarHtmlPdfMensual = (): string => {
  const c = consolidadoMensual.value!
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  // Grupos que deben permanecer juntos en la misma hoja
  const gruposMismaHoja = ['Direccion', 'Servicio', 'Cana']

  // Generar HTML con grupos
  let gruposHtml = ''
  const grupos = consolidadoMensualAgrupado.value
  for (let i = 0; i < grupos.length; i++) {
    const grupo = grupos[i]
    const prevGrupo = i > 0 ? grupos[i - 1] : null

    // Determinar si necesita salto de página
    const esGrupoEspecial = gruposMismaHoja.some(g => grupo.nombre.toLowerCase().includes(g.toLowerCase()))
    const prevEsGrupoEspecial = prevGrupo ? gruposMismaHoja.some(g => prevGrupo.nombre.toLowerCase().includes(g.toLowerCase())) : false

    // Agregar salto de página excepto: primer grupo, o si ambos (actual y anterior) son grupos especiales
    const necesitaSalto = i > 0 && !(esGrupoEspecial && prevEsGrupoEspecial)
    const pageBreakClass = necesitaSalto ? 'page-break' : ''

    let rows = ''
    grupo.trabajadores.forEach((item, idx) => {
      const calTexto = getCalificacionTexto(item.calificacion)
      const calClass = getBadgeClass(item.calificacion)
      const cargoHtml = item.trabajadorCargo ? `<span class="cargo-sub">${item.trabajadorCargo}</span>` : ''
      rows += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="nombre-celda">
            <span class="nombre">${item.trabajadorNombre}</span>
            ${cargoHtml}
          </td>
          <td class="center">${item.trabajadorRuc || '-'}</td>
          <td class="center"><span class="cal-badge ${calClass}">${calTexto}</span></td>
          <td class="comentarios">${item.comentarios || '-'}</td>
          <td class="firma-cell"></td>
        </tr>
      `
    })

    // Header de página (solo en páginas con salto)
    const headerPagina = necesitaSalto ? `
      <div class="header-pagina">
        <div class="header-pagina-left">
          <span class="titulo-pagina">Finca # 3 Managua</span>
          <span class="subtitulo-pagina">Consolidado de Evaluaciones - ${c.mes} ${c.year}</span>
        </div>
        <div class="header-pagina-right">${fecha}</div>
      </div>
    ` : ''

    gruposHtml += `
      <div class="grupo-section ${pageBreakClass}">
        ${headerPagina}
        <div class="grupo-header">
          <span class="grupo-nombre">${grupo.nombre}</span>
          <span class="grupo-count">${grupo.trabajadores.length} trabajadores</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width:30px">#</th>
              <th style="width:28%">Trabajador</th>
              <th class="center" style="width:10%">RUC</th>
              <th class="center" style="width:10%">Evaluacion</th>
              <th style="width:22%">Observaciones</th>
              <th class="center" style="width:80px">Firma</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Evaluaciones ${c.mes} ${c.year}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 15mm 12mm;
          font-size: 10pt;
          color: #333;
          line-height: 1.4;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
        .header-left h1 {
          font-size: 16pt;
          color: #2c3e50;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .header-left h2 {
          font-size: 12pt;
          color: #7f8c8d;
          font-weight: normal;
        }
        .header-right {
          text-align: right;
          font-size: 9pt;
          color: #7f8c8d;
        }
        .header-right .fecha {
          font-weight: 600;
          color: #2c3e50;
        }

        /* Stats */
        .stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          gap: 8px;
        }
        .stat-box {
          flex: 1;
          text-align: center;
          padding: 10px 5px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #fafafa;
        }
        .stat-box.highlight { background: #2c3e50; color: white; border-color: #2c3e50; }
        .stat-box.superior { background: #e8f5e9; border-color: #4caf50; }
        .stat-box.adecuado { background: #fff8e1; border-color: #ff9800; }
        .stat-box.deficiente { background: #ffebee; border-color: #f44336; }
        .stat-value { font-size: 18pt; font-weight: 700; display: block; }
        .stat-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        thead tr { background: #2c3e50; }
        th {
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        th.center, td.center { text-align: center; }
        td {
          padding: 7px 6px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 9pt;
        }
        tr:nth-child(even) { background: #f8f9fa; }
        tr:hover { background: #f0f0f0; }
        .nombre-celda { display: flex; flex-direction: column; }
        .nombre { font-weight: 500; }
        .cargo-sub {
          font-size: 7pt;
          color: #666;
          font-weight: 400;
          margin-top: 1px;
        }
        .comentarios {
          max-width: 180px;
          font-size: 8pt;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Calificacion badges */
        .cal-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 8pt;
          font-weight: 600;
        }
        .cal-badge.superior { background: #c8e6c9; color: #2e7d32; }
        .cal-badge.adecuado { background: #ffe0b2; color: #e65100; }
        .cal-badge.deficiente { background: #ffcdd2; color: #c62828; }

        /* Footer */
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #999;
        }

        /* Leyenda */
        .leyenda {
          display: flex;
          justify-content: center;
          gap: 25px;
          margin-bottom: 12px;
          font-size: 8pt;
        }
        .leyenda-item { display: flex; align-items: center; gap: 6px; }
        .leyenda-dot {
          width: 14px; height: 14px; border-radius: 3px; display: inline-block;
        }
        .leyenda-dot.superior { background: #c8e6c9; }
        .leyenda-dot.adecuado { background: #ffe0b2; }
        .leyenda-dot.deficiente { background: #ffcdd2; }

        /* Header de página repetido */
        .header-pagina {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .header-pagina-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .titulo-pagina {
          font-size: 14pt;
          font-weight: 700;
          color: #2c3e50;
          text-transform: uppercase;
        }
        .subtitulo-pagina {
          font-size: 10pt;
          color: #7f8c8d;
        }
        .header-pagina-right {
          font-size: 9pt;
          color: #7f8c8d;
          font-weight: 600;
        }

        /* Grupos */
        .grupo-section { margin-bottom: 20px; }
        .grupo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #2c3e50;
          color: white;
          border-radius: 4px 4px 0 0;
          font-size: 10pt;
        }
        .grupo-nombre { font-weight: 600; }
        .grupo-count {
          background: rgba(255,255,255,0.2);
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 8pt;
        }
        .grupo-section table { margin-top: 0; }
        .firma-cell {
          width: 80px;
          min-width: 80px;
          border-bottom: 1px solid #999;
        }

        /* Saltos de página */
        .page-break {
          page-break-before: always;
        }

        @media print {
          body { padding: 12mm; }
          .stat-box, .stat-box.highlight, .stat-box.superior, .stat-box.adecuado, .stat-box.deficiente {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          thead tr, .cal-badge, .leyenda-dot, .grupo-header {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
        @page {
          size: letter portrait;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>Finca # 3 Managua</h1>
          <h2>Consolidado de Evaluaciones - ${c.mes} ${c.year}</h2>
        </div>
        <div class="header-right">
          <div class="fecha">${fecha}</div>
          <div>Consolidado Mensual</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box highlight">
          <span class="stat-value">${c.total}</span>
          <span class="stat-label">Evaluados</span>
        </div>
        <div class="stat-box superior">
          <span class="stat-value">${c.superiores}</span>
          <span class="stat-label">Superiores</span>
        </div>
        <div class="stat-box adecuado">
          <span class="stat-value">${c.adecuados}</span>
          <span class="stat-label">Adecuados</span>
        </div>
        <div class="stat-box deficiente">
          <span class="stat-value">${c.deficientes}</span>
          <span class="stat-label">Deficientes</span>
        </div>
      </div>

      <div class="leyenda">
        <div class="leyenda-item"><span class="leyenda-dot superior"></span> Superior (3)</div>
        <div class="leyenda-item"><span class="leyenda-dot adecuado"></span> Adecuado (2)</div>
        <div class="leyenda-item"><span class="leyenda-dot deficiente"></span> Deficiente (1)</div>
      </div>

      ${gruposHtml}

      <div class="footer">
        <span>Sistema de Gestion Agricola</span>
        <span>Pagina 1 de 1</span>
      </div>
    </body>
    </html>
  `
}

// Tab: Consolidado Trimestral
const yearTrimestral = ref(currentYear)
const mesInicioTrimestral = ref('Enero')
const mesFinTrimestral = ref('Marzo')
const isLoadingTrimestral = ref(false)
const consolidadoTrimestral = ref<ConsolidadoTrimestral | null>(null)

// Computed: agrupar consolidado trimestral por grupo
const consolidadoTrimestralAgrupado = computed(() => {
  if (!consolidadoTrimestral.value || consolidadoTrimestral.value.data.length === 0) {
    return []
  }

  // Agrupar por grupoNombre
  const grupos: Record<string, ConsolidadoTrimestralItem[]> = {}

  for (const item of consolidadoTrimestral.value.data) {
    const grupoKey = item.grupoNombre || 'Sin Grupo'
    if (!grupos[grupoKey]) {
      grupos[grupoKey] = []
    }
    grupos[grupoKey].push(item)
  }

  // Convertir a array ordenado (Sin Grupo al final)
  const gruposOrdenados = Object.keys(grupos).sort((a, b) => {
    if (a === 'Sin Grupo') return 1
    if (b === 'Sin Grupo') return -1
    return a.localeCompare(b)
  })

  return gruposOrdenados.map(nombre => ({
    nombre,
    trabajadores: grupos[nombre]
  }))
})

const cargarConsolidadoTrimestral = async () => {
  // Validate range
  const idxInicio = meses.indexOf(mesInicioTrimestral.value)
  const idxFin = meses.indexOf(mesFinTrimestral.value)
  if (idxInicio > idxFin) {
    showMensaje('El mes de inicio debe ser anterior al mes fin', 'error')
    return
  }

  isLoadingTrimestral.value = true
  try {
    const response = await EvaluacionService.getConsolidadoTrimestral(
      yearTrimestral.value,
      mesInicioTrimestral.value,
      mesFinTrimestral.value
    )
    consolidadoTrimestral.value = response.data
  } catch (error) {
    console.error('Error:', error)
    consolidadoTrimestral.value = null
    showMensaje('Error al cargar consolidado trimestral', 'error')
  } finally {
    isLoadingTrimestral.value = false
  }
}

const exportarPdfTrimestral = () => {
  if (!consolidadoTrimestral.value) return

  const html = generarHtmlPdfTrimestral()
  abrirVentanaImpresion(html)
}

const generarHtmlPdfTrimestral = (): string => {
  const c = consolidadoTrimestral.value!
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  const headerMeses = c.meses.map(m => `<th class="mes-col">${m.substring(0, 3)}</th>`).join('')

  // Calculate stats with new logic
  let aceptables = 0
  let deficientes = 0

  // Grupos que deben permanecer juntos en la misma hoja
  const gruposMismaHoja = ['Direccion', 'Servicio', 'Cana']

  // Generar HTML con grupos
  let gruposHtml = ''
  const grupos = consolidadoTrimestralAgrupado.value
  for (let i = 0; i < grupos.length; i++) {
    const grupo = grupos[i]
    const prevGrupo = i > 0 ? grupos[i - 1] : null

    // Determinar si necesita salto de página
    const esGrupoEspecial = gruposMismaHoja.some(g => grupo.nombre.toLowerCase().includes(g.toLowerCase()))
    const prevEsGrupoEspecial = prevGrupo ? gruposMismaHoja.some(g => prevGrupo.nombre.toLowerCase().includes(g.toLowerCase())) : false

    // Agregar salto de página excepto: primer grupo, o si ambos (actual y anterior) son grupos especiales
    const necesitaSalto = i > 0 && !(esGrupoEspecial && prevEsGrupoEspecial)
    const pageBreakClass = necesitaSalto ? 'page-break' : ''

    let rows = ''
    grupo.trabajadores.forEach((item, idx) => {
      const mesesCols = c.meses.map(m => {
        const cal = item.calificacionesPorMes[m]
        if (cal) {
          const cls = getBadgeClass(cal)
          const inicial = getCalificacionTexto(cal).charAt(0) // S, A, D
          return `<td class="mes-col"><span class="cal-mini ${cls}">${inicial}</span></td>`
        }
        return '<td class="mes-col sin-eval">-</td>'
      }).join('')

      // Count deficient months for this worker
      const mesesDef = Object.values(item.calificacionesPorMes).filter(cal => cal <= 2).length
      const resultado = mesesDef >= 2 ? 'Deficiente' : 'Aceptable'
      const resultadoCls = mesesDef >= 2 ? 'deficiente' : 'aceptable'

      if (mesesDef >= 2) deficientes++
      else aceptables++

      const cargoHtml = item.trabajadorCargo ? `<span class="cargo-sub">${item.trabajadorCargo}</span>` : ''
      rows += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="nombre-celda">
            <span class="nombre">${item.trabajadorNombre}</span>
            ${cargoHtml}
          </td>
          ${mesesCols}
          <td class="center def-count">${mesesDef}</td>
          <td class="center"><span class="resultado-badge ${resultadoCls}">${resultado}</span></td>
          <td class="firma-cell"></td>
        </tr>
      `
    })

    // Header de página (solo en páginas con salto)
    const headerPagina = necesitaSalto ? `
      <div class="header-pagina">
        <div class="header-pagina-left">
          <span class="titulo-pagina">Finca # 3 Managua</span>
          <span class="subtitulo-pagina">Evaluaciones ${c.mesInicio} - ${c.mesFin} ${c.year}</span>
        </div>
        <div class="header-pagina-right">${fecha}</div>
      </div>
    ` : ''

    gruposHtml += `
      <div class="grupo-section ${pageBreakClass}">
        ${headerPagina}
        <div class="grupo-header">
          <span class="grupo-nombre">${grupo.nombre}</span>
          <span class="grupo-count">${grupo.trabajadores.length} trabajadores</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width:25px">#</th>
              <th style="width:22%">Trabajador</th>
              ${headerMeses}
              <th class="center" style="width:30px">Def.</th>
              <th class="center">Resultado</th>
              <th class="center" style="width:60px">Firma</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Evaluaciones ${c.mesInicio} - ${c.mesFin} ${c.year}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 12mm 10mm;
          font-size: 9pt;
          color: #333;
          line-height: 1.3;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .header-left h1 {
          font-size: 14pt;
          color: #2c3e50;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .header-left h2 {
          font-size: 11pt;
          color: #7f8c8d;
          font-weight: normal;
        }
        .header-right {
          text-align: right;
          font-size: 8pt;
          color: #7f8c8d;
        }
        .header-right .fecha { font-weight: 600; color: #2c3e50; }

        /* Stats */
        .stats-row {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
          gap: 15px;
        }
        .stat-box {
          text-align: center;
          padding: 8px 20px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #fafafa;
        }
        .stat-box.highlight { background: #2c3e50; color: white; border-color: #2c3e50; }
        .stat-box.aceptable { background: #e8f5e9; border-color: #4caf50; }
        .stat-box.aceptable .stat-value { color: #2e7d32; }
        .stat-box.deficiente { background: #ffebee; border-color: #f44336; }
        .stat-box.deficiente .stat-value { color: #c62828; }
        .stat-value { font-size: 16pt; font-weight: 700; display: block; }
        .stat-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }

        /* Info criterio */
        .info-criterio {
          text-align: center;
          margin-bottom: 10px;
          padding: 6px 12px;
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 4px;
          font-size: 8pt;
          color: #1565c0;
        }

        /* Leyenda */
        .leyenda {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 8pt;
        }
        .leyenda-item { display: flex; align-items: center; gap: 5px; }
        .leyenda-dot {
          width: 12px; height: 12px; border-radius: 3px; display: inline-block;
        }
        .leyenda-dot.superior { background: #c8e6c9; }
        .leyenda-dot.adecuado { background: #ffe0b2; }
        .leyenda-dot.deficiente { background: #ffcdd2; }

        /* Header de página repetido */
        .header-pagina {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .header-pagina-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .titulo-pagina {
          font-size: 12pt;
          font-weight: 700;
          color: #2c3e50;
          text-transform: uppercase;
        }
        .subtitulo-pagina {
          font-size: 9pt;
          color: #7f8c8d;
        }
        .header-pagina-right {
          font-size: 8pt;
          color: #7f8c8d;
          font-weight: 600;
        }

        /* Grupos */
        .grupo-section { margin-bottom: 15px; }
        .grupo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #2c3e50;
          color: white;
          border-radius: 4px 4px 0 0;
          font-size: 9pt;
        }
        .grupo-nombre { font-weight: 600; }
        .grupo-count {
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 7pt;
        }
        .grupo-section table { margin-top: 0; }

        /* Table */
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #4a5568; }
        th {
          color: white;
          padding: 6px 4px;
          text-align: left;
          font-size: 7pt;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 600;
        }
        th.center, td.center { text-align: center; }
        th.mes-col { text-align: center; width: 35px; }
        td {
          padding: 5px 4px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 8pt;
        }
        td.mes-col { text-align: center; width: 35px; }
        td.def-count { font-weight: 600; color: #c62828; }
        tr:nth-child(even) { background: #f8f9fa; }
        .nombre-celda { display: flex; flex-direction: column; }
        .nombre { font-weight: 500; white-space: nowrap; }
        .cargo-sub {
          font-size: 6pt;
          color: #666;
          font-weight: 400;
          margin-top: 1px;
        }
        .sin-eval { color: #ccc; }

        /* Mini badges para meses */
        .cal-mini {
          display: inline-block;
          width: 18px; height: 18px;
          line-height: 18px;
          text-align: center;
          border-radius: 3px;
          font-size: 8pt;
          font-weight: 700;
        }
        .cal-mini.superior { background: #c8e6c9; color: #2e7d32; }
        .cal-mini.adecuado { background: #ffe0b2; color: #e65100; }
        .cal-mini.deficiente { background: #ffcdd2; color: #c62828; }

        /* Resultado badge */
        .resultado-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 7pt;
          font-weight: 700;
          text-transform: uppercase;
        }
        .resultado-badge.aceptable { background: #c8e6c9; color: #2e7d32; }
        .resultado-badge.deficiente { background: #ffcdd2; color: #c62828; }

        /* Saltos de página */
        .page-break {
          page-break-before: always;
        }

        /* Footer */
        .footer {
          margin-top: 15px;
          padding-top: 8px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          font-size: 7pt;
          color: #999;
        }

        @media print {
          body { padding: 10mm 12mm; }
          thead tr, .cal-mini, .resultado-badge, .stat-box.highlight, .stat-box.aceptable, .stat-box.deficiente, .leyenda-dot, .info-criterio, .grupo-header {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
        @page {
          size: letter landscape;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>Finca # 3 Managua</h1>
          <h2>Evaluaciones ${c.mesInicio} - ${c.mesFin} ${c.year}</h2>
        </div>
        <div class="header-right">
          <div class="fecha">${fecha}</div>
          <div>Consolidado Trimestral</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box highlight">
          <span class="stat-value">${c.total}</span>
          <span class="stat-label">Evaluados</span>
        </div>
        <div class="stat-box aceptable">
          <span class="stat-value">${aceptables}</span>
          <span class="stat-label">Aceptables</span>
        </div>
        <div class="stat-box deficiente">
          <span class="stat-value">${deficientes}</span>
          <span class="stat-label">Deficientes</span>
        </div>
      </div>

      <div class="info-criterio">
        <strong>Criterio:</strong> 2 o mas meses con calificacion Deficiente = Resultado DEFICIENTE | De lo contrario = ACEPTABLE
      </div>

      <div class="leyenda">
        <div class="leyenda-item"><span class="leyenda-dot superior"></span> S = Superior</div>
        <div class="leyenda-item"><span class="leyenda-dot adecuado"></span> A = Adecuado</div>
        <div class="leyenda-item"><span class="leyenda-dot deficiente"></span> D = Deficiente</div>
        <div class="leyenda-item" style="margin-left:15px"><strong>Def.</strong> = Meses con Deficiente</div>
      </div>

      ${gruposHtml}

      <div class="footer">
        <span>Sistema de Gestion Agricola</span>
        <span>Pagina 1 de 1</span>
      </div>
    </body>
    </html>
  `
}

const abrirVentanaImpresion = (html: string) => {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (doc) {
    doc.write(html)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 100)
    }, 100)
  }
}

// Init
onMounted(() => {
  cargarEvaluacionesPorPeriodo()
})
</script>

<style scoped>
.evaluacion-trabajadores {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2em;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-weight: 600;
  color: #7f8c8d;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: #ecf0f1;
  color: #2c3e50;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Tab Content */
.tab-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Filtros */
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filtro-grupo label {
  font-weight: 600;
  color: #555;
  font-size: 0.9em;
}

.filtro-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  min-width: 150px;
}

.filtro-select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-cargar, .btn-guardar, .btn-pdf {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cargar {
  background-color: #3498db;
  color: white;
}

.btn-cargar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #229954;
}

.btn-pdf {
  background-color: #e74c3c;
  color: white;
}

.btn-pdf:hover:not(:disabled) {
  background-color: #c0392b;
}

.btn-cargar:disabled, .btn-guardar:disabled, .btn-pdf:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Loading */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sin datos */
.sin-datos {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 4em;
  display: block;
  margin-bottom: 15px;
}

/* Tabla */
.tabla-contenedor {
  overflow-x: auto;
}

.resumen-bar {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 0.95em;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}

.tabla thead {
  background-color: #34495e;
  color: white;
}

.tabla th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9em;
}

.tabla td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla tbody tr:hover {
  background-color: #f8f9fa;
}

.comentarios-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Badge calificación */
.badge-cal {
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9em;
}

.badge-cal.superior {
  background-color: #d4edda;
  color: #155724;
}

.badge-cal.adecuado {
  background-color: #fff3cd;
  color: #856404;
}

.badge-cal.deficiente {
  background-color: #f8d7da;
  color: #721c24;
}

.sin-eval {
  color: #bdc3c7;
}

/* Tabla evaluar */
.tabla-evaluar .calificacion-btns {
  display: flex;
  gap: 5px;
}

.cal-btn {
  padding: 6px 12px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.2s ease;
}

.cal-btn.deficiente {
  border-color: #e74c3c;
  color: #e74c3c;
}

.cal-btn.adecuado {
  border-color: #f39c12;
  color: #f39c12;
}

.cal-btn.superior {
  border-color: #27ae60;
  color: #27ae60;
}

.cal-btn:hover {
  opacity: 0.8;
}

.cal-btn.active.deficiente {
  background-color: #e74c3c;
  color: white;
}

.cal-btn.active.adecuado {
  background-color: #f39c12;
  color: white;
}

.cal-btn.active.superior {
  background-color: #27ae60;
  color: white;
}

.input-comentario {
  width: 100%;
  max-width: 250px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
}

.input-comentario:focus {
  outline: none;
  border-color: #667eea;
}

/* Info propuestos */
.info-propuestos {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #f39c12;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.info-icon {
  font-size: 1.5em;
}

.info-criterios {
  color: #856404;
  font-size: 0.85em;
}

/* Columna exclusión */
.col-excluir {
  width: 140px;
  text-align: center;
}

.exclusion-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.checkbox-excluir {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #e74c3c;
}

.select-motivo {
  width: 120px;
  padding: 4px;
  font-size: 0.8em;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Filas con estados */
.row-excluido {
  background-color: #f8f9fa !important;
  opacity: 0.6;
}

.row-excluido td {
  text-decoration: line-through;
  color: #999;
}

.row-excluido .col-excluir,
.row-excluido .exclusion-control,
.row-excluido .excluido-label,
.row-excluido .motivo-exclusion {
  text-decoration: none;
  opacity: 1;
}

.row-propuesto {
  background-color: #fff8e1 !important;
}

.excluido-label {
  color: #999;
  font-style: italic;
  font-size: 0.85em;
}

.motivo-exclusion {
  color: #666;
  font-style: italic;
  font-size: 0.85em;
}

/* Badge propuesto */
.badge-propuesto {
  margin-left: 5px;
  cursor: help;
}

/* Badge evaluación existente */
.badge-existente {
  margin-left: 5px;
  cursor: help;
  color: #3498db;
}

.propuesta-info {
  display: inline-block;
}

.propuesta-info .badge-cal {
  font-size: 0.75em;
  padding: 2px 6px;
}

.propuesta-ok {
  color: #27ae60;
  font-weight: 600;
}

/* Colores de texto */
.text-danger {
  color: #e74c3c;
}

.text-warning {
  color: #f39c12;
}

.text-success {
  color: #27ae60;
}

.text-info {
  color: #3498db;
}

/* Consolidado Trimestral mejorado */
.info-criterio {
  background: #e8f4fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95em;
}

.tabla-trimestral .col-mes {
  width: 50px;
  text-align: center;
}

.tabla-trimestral .col-contador {
  width: 60px;
  text-align: center;
}

.tabla-trimestral .col-resultado {
  width: 100px;
  text-align: center;
}

/* Columna Firma */
.col-firma {
  width: 100px;
  min-width: 100px;
  text-align: center;
  border-bottom: 1px solid #ccc;
}

/* Celda trabajador con nombre y cargo */
.celda-trabajador {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nombre-trabajador {
  font-weight: 500;
}
.cargo-trabajador {
  font-size: 0.75em;
  color: #666;
  font-weight: 400;
}

.tabla-trimestral .nombre-col {
  font-weight: 500;
}

.badge-mini {
  display: inline-block;
  width: 26px;
  height: 26px;
  line-height: 26px;
  text-align: center;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85em;
}

.badge-mini.superior {
  background-color: #d4edda;
  color: #155724;
}

.badge-mini.adecuado {
  background-color: #fff3cd;
  color: #856404;
}

.badge-mini.deficiente {
  background-color: #f8d7da;
  color: #721c24;
}

.contador-def {
  font-weight: 600;
  color: #666;
}

.contador-def.alerta {
  color: #e74c3c;
  font-weight: 700;
}

.badge-resultado {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.badge-resultado.aceptable {
  background-color: #d4edda;
  color: #155724;
}

.badge-resultado.deficiente {
  background-color: #f8d7da;
  color: #721c24;
}

.row-deficiente-final {
  background-color: #fff5f5 !important;
}

.row-deficiente-final:hover {
  background-color: #ffe8e8 !important;
}

.leyenda-trimestral {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.85em;
  color: #666;
}

.leyenda-trimestral .separador {
  color: #ddd;
}

.stat-card.aceptable {
  background: #d4edda;
}

/* Stats cards */
.stats-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  min-width: 120px;
  flex: 1;
}

.stat-card.promedio {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.superior {
  background: #d4edda;
}

.stat-card.adecuado {
  background: #fff3cd;
}

.stat-card.deficiente {
  background: #f8d7da;
}

.stat-value {
  font-size: 2em;
  font-weight: 700;
  display: block;
}

.stat-label {
  font-size: 0.85em;
  color: inherit;
  opacity: 0.8;
}

/* Consolidado content */
.consolidado-content {
  animation: fadeIn 0.3s ease;
}

/* Grupos en consolidado mensual */
.grupo-section {
  margin-bottom: 25px;
}

.grupo-section:last-child {
  margin-bottom: 0;
}

.grupo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
}

.grupo-icon {
  font-size: 1.3em;
}

.grupo-nombre {
  font-size: 1.1em;
  flex: 1;
}

.grupo-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: 500;
}

.tabla-grupo {
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  margin-bottom: 0;
}

.tabla-grupo thead {
  background-color: #4a5568;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mensajes */
.mensaje {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mensaje.exito {
  background-color: #d4edda;
  color: #155724;
}

.mensaje.error {
  background-color: #f8d7da;
  color: #721c24;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

/* Responsive */
@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
    font-size: 0.85em;
    padding: 10px;
  }

  .filtros {
    flex-direction: column;
  }

  .filtro-grupo, .btn-cargar, .btn-guardar, .btn-pdf {
    width: 100%;
  }

  .stats-cards {
    flex-direction: column;
  }
}
</style>
