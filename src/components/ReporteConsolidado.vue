<!-- src/components/ReporteConsolidado.vue -->

<template>
  <div class="reporte-consolidado">
    <h2>Reporte Consolidado Mensual</h2>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <label for="year">Año</label>
        <select id="year" v-model="yearSeleccionado" class="filter-select">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="mes">Mes</label>
        <select id="mes" v-model="mesSeleccionado" class="filter-select">
          <option v-for="mes in meses" :key="mes" :value="mes">
            {{ mes }}
          </option>
        </select>
      </div>

      <div class="filter-actions">
        <button @click="consultar" class="btn-consultar" :disabled="isLoading">
          {{ isLoading ? 'Consultando...' : 'Consultar' }}
        </button>
        <button
          @click="exportarPdf"
          class="btn-pdf"
          :disabled="isLoading || !reporteData"
        >
          📄 Exportar PDF
        </button>
        <button
          @click="verTrabajadoresExcedidos"
          class="btn-excedidos"
          :disabled="isLoading || !reporteData"
          title="Ver trabajadores con más de 8 horas en algún día"
        >
          ⚠️ Excedidos
        </button>
        <button
          @click="verTrabajadoresFaltantes"
          class="btn-faltantes"
          :disabled="isLoading"
          title="Ver trabajadores activos no reportados en el consolidado"
        >
          🔍 No Reportados
        </button>
        <button
          @click="verTrabajadoresMenor8Horas"
          class="btn-menor8"
          :disabled="isLoading || !reporteData"
          title="Ver trabajadores con menos de 8 horas en algún día"
        >
          ⏱️ Menos de 8h
        </button>
        <button
          @click="cargarHorasPrenomina"
          class="btn-prenomina"
          :disabled="isLoading || !reporteData"
          title="Cargar horas desde archivo de prenómina Excel"
        >
          📥 Prenómina
        </button>
        <router-link
          to="/evaluaciones"
          class="btn-evaluaciones"
          :class="{ disabled: isLoading || !reporteData }"
          title="Evaluar trabajadores"
        >
          ⭐ Evaluar
        </router-link>
      </div>
    </div>

    <!-- Botones de Reportes Estratégicos -->
    <div class="reportes-estrategicos">
      <h3>📊 Reportes Estratégicos</h3>
      <div class="reportes-buttons">
        <router-link to="/reportes/ausentismo" class="reporte-btn ausentismo">
          <div class="btn-icon">📋</div>
          <div class="btn-text">
            <strong>Ausentismo</strong>
            <span>Faltas y asistencia</span>
          </div>
        </router-link>

        <router-link to="/reportes/productividad" class="reporte-btn productividad">
          <div class="btn-icon">⚡</div>
          <div class="btn-text">
            <strong>Productividad</strong>
            <span>Cumplimiento de norma</span>
          </div>
        </router-link>

        <router-link to="/reportes/rankings" class="reporte-btn rankings">
          <div class="btn-icon">🏆</div>
          <div class="btn-text">
            <strong>Rankings</strong>
            <span>Top performers</span>
          </div>
        </router-link>

        <router-link to="/reportes/horas-excedidas" class="reporte-btn excedidas">
          <div class="btn-icon">⏰</div>
          <div class="btn-text">
            <strong>Horas Excedidas</strong>
            <span>Sobretiempo</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Generando reporte consolidado...</p>
    </div>

    <!-- Reporte -->
    <div v-else-if="reporteData && reporteData.trabajadores && reporteData.trabajadores.length > 0" class="reporte-container">
      <!-- Encabezado del Reporte -->
      <div class="reporte-header">
        <h3>REPORTE DE TIEMPO DE TRABAJO</h3>
        <p><strong>Mes:</strong> {{ reporteData.mes }} - <strong>Año:</strong> {{ reporteData.year }}</p>
        <p><strong>Total de trabajadores:</strong> {{ reporteData.trabajadores.length }}</p>
      </div>

      <!-- Tabla de Trabajadores -->
      <div class="table-responsive">
        <table class="reporte-table">
          <thead>
            <tr>
              <th rowspan="2" class="header-numero">#</th>
              <th rowspan="2" class="header-nombre">NOMBRE (S)<br>APELLIDOS Y CARGOS</th>
              <th
                v-for="dia in diasDelMes"
                :key="dia"
                class="header-dia-semana"
                :class="{
                  'dia-sabado': esSabado(dia),
                  'dia-domingo': esDomingo(dia)
                }"
              >
                {{ getDiaSemanaBrev(dia) }}
              </th>
              <th rowspan="2" class="header-total header-total-doble">
                <div class="total-header-split">
                  <span class="total-label-horas">Horas</span>
                  <span class="total-label-norma">Norma</span>
                </div>
              </th>
            </tr>
            <tr>
              <th
                v-for="dia in diasDelMes"
                :key="'num-' + dia"
                class="dia-col"
                :class="{
                  'dia-sabado': esSabado(dia),
                  'dia-domingo': esDomingo(dia)
                }"
              >
                {{ dia }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(trabajador, index) in reporteData.trabajadores" :key="trabajador.trabajadorId">
              <td class="row-number">{{ index + 1 }}</td>
              <td class="nombre-col">
                <strong>{{ trabajador.nombre }}</strong>
                <span class="subtext">{{ trabajador.cargo || 'Sin cargo' }}</span>
              </td>
              <td
                v-for="dia in diasDelMes"
                :key="dia"
                class="celda-dividida"
                :class="{
                  'celda-sabado': esSabado(dia),
                  'celda-domingo': esDomingo(dia)
                }"
              >
                <div class="celda-contenido">
                  <div
                    class="celda-horas"
                    :class="{ 'tiene-valor': trabajador.horasPorDia[dia] }"
                  >
                    {{ trabajador.horasPorDia[dia] || '-' }}
                  </div>
                  <div
                    class="celda-norma"
                    :class="{ 'tiene-valor': trabajador.normaPorDia && trabajador.normaPorDia[dia] }"
                  >
                    {{ (trabajador.normaPorDia && trabajador.normaPorDia[dia]) || '-' }}
                  </div>
                </div>
              </td>
              <td class="total-col-doble">
                <div class="total-contenido">
                  <span class="total-horas">{{ trabajador.totalHoras || 0 }}</span>
                  <span class="total-norma">{{ trabajador.totalNorma || 0 }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumen -->
      <div class="reporte-footer">
        <p><strong>Total de trabajadores:</strong> {{ reporteData.trabajadores.length }}</p>
        <p><strong>Días laborales:</strong> {{ diasDelMes.length }}</p>
        <p><strong>Fecha de generación:</strong> {{ fechaActual }}</p>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else-if="!isLoading && consultado" class="no-data">
      <span class="empty-icon">📋</span>
      <p>No se encontraron registros para el período seleccionado</p>
      <p class="subtext">Seleccione otro mes o año para consultar</p>
    </div>

    <!-- Inicial -->
    <div v-else class="inicial">
      <span class="empty-icon">📊</span>
      <p>Seleccione un mes y año para consultar el reporte consolidado</p>
    </div>

    <!-- Modal Trabajadores Excedidos -->
    <div v-if="mostrarModalExcedidos" class="modal-overlay">
      <div class="modal-excedidos">
        <div class="modal-header">
          <h3>⚠️ Trabajadores con Horas Excedidas</h3>
          <button @click="cerrarModalExcedidos" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="isLoadingExcedidos" class="loading-modal">
            <div class="spinner-small"></div>
            <p>Cargando trabajadores con horas excedidas...</p>
          </div>

          <div v-else-if="trabajadoresExcedidos.length > 0" class="excedidos-container">
            <div class="info-message">
              Se encontraron <strong>{{ trabajadoresExcedidos.length }}</strong> trabajador(es) con horas superiores a 8 en algún día.
            </div>

            <div v-for="trabajador in trabajadoresExcedidos" :key="trabajador.trabajadorId" class="trabajador-excedido">
              <div class="trabajador-header">
                <div class="trabajador-info">
                  <h4>{{ trabajador.nombre }}</h4>
                  <p class="subinfo">RUC: {{ trabajador.ruc }} | Cargo: {{ trabajador.cargo || 'Sin cargo' }}</p>
                </div>
                <span class="excedidos-badge">{{ trabajador.diasExcedidos.length }} día(s)</span>
              </div>

              <table class="dias-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Horas Registradas</th>
                    <th>Exceso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(dia, index) in trabajador.diasExcedidos" :key="index">
                    <td class="fecha-col">{{ dia.fecha }}</td>
                    <td class="horas-col">{{ dia.horas }}</td>
                    <td class="exceso-col">{{ (dia.horas - 8).toFixed(2) }}h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="no-excedidos">
            <span class="success-icon">✓</span>
            <p>No hay trabajadores con horas excedidas en este período.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cerrarModalExcedidos" class="btn-cerrar">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Trabajadores Faltantes -->
    <div v-if="mostrarModalFaltantes" class="modal-overlay">
      <div class="modal-faltantes">
        <div class="modal-header">
          <h3>🔍 Trabajadores No Reportados</h3>
          <button @click="cerrarModalFaltantes" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="isLoadingFaltantes" class="loading-modal">
            <div class="spinner-small"></div>
            <p>Cargando trabajadores no reportados...</p>
          </div>

          <div v-else-if="trabajadoresFaltantes.length > 0" class="faltantes-container">
            <div class="info-message warning">
              Se encontraron <strong>{{ trabajadoresFaltantes.length }}</strong> trabajador(es) activo(s) no reportado(s) en el consolidado de {{ mesSeleccionado }} {{ yearSeleccionado }}.
            </div>

            <table class="faltantes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>RUC</th>
                  <th>Cargo</th>
                  <th>Cuenta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trabajador, index) in trabajadoresFaltantes" :key="trabajador.trabajadorId">
                  <td class="numero">{{ index + 1 }}</td>
                  <td class="nombre">{{ trabajador.nombre }}</td>
                  <td class="ruc">{{ trabajador.ruc || '-' }}</td>
                  <td class="cargo">{{ trabajador.cargo || '-' }}</td>
                  <td class="cuenta">{{ trabajador.cuenta || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="no-faltantes">
            <span class="success-icon">✓</span>
            <p>Todos los trabajadores activos están reportados en el consolidado de {{ mesSeleccionado }} {{ yearSeleccionado }}.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cerrarModalFaltantes" class="btn-cerrar">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Trabajadores con Menos de 8 Horas -->
    <div v-if="mostrarModalMenor8" class="modal-overlay">
      <div class="modal-menor8">
        <div class="modal-header">
          <h3>⏱️ Trabajadores con Menos de 8 Horas</h3>
          <button @click="cerrarModalMenor8" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="trabajadoresMenor8.length > 0" class="menor8-container">
            <div class="info-message">
              Se encontraron <strong>{{ trabajadoresMenor8.length }}</strong> trabajador(es) con días trabajados menores a 8 horas.
            </div>

            <div v-for="trabajador in trabajadoresMenor8" :key="trabajador.trabajadorId" class="trabajador-menor8">
              <div class="trabajador-header">
                <div class="trabajador-info">
                  <h4>{{ trabajador.nombre }}</h4>
                  <p class="subinfo">Cargo: {{ trabajador.cargo || 'Sin cargo' }}</p>
                </div>
                <span class="dias-badge">{{ trabajador.diasMenor8.length }} día(s)</span>
              </div>

              <table class="horas-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Horas Trabajadas</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(dia, index) in trabajador.diasMenor8" :key="index">
                    <td class="dia-col">{{ dia.dia }}</td>
                    <td class="horas-col">{{ dia.horas }}h</td>
                    <td class="diferencia-col">-{{ (8 - dia.horas).toFixed(2) }}h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="no-menor8">
            <span class="success-icon">✓</span>
            <p>No hay trabajadores con menos de 8 horas en este período. Todos trabajan 8 horas o más.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cerrarModalMenor8" class="btn-cerrar">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Prenómina -->
    <div v-if="mostrarModalPrenomina" class="modal-overlay">
      <div class="modal-prenomina">
        <div class="modal-header prenomina-header">
          <h3>📥 Escribir Horas en Prenómina</h3>
          <button @click="cerrarModalPrenomina" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="isLoadingPrenomina" class="loading-modal">
            <div class="spinner-small"></div>
            <p>Escribiendo horas en el archivo de prenómina...</p>
          </div>

          <div v-else-if="comparacionPrenomina.length > 0" class="prenomina-container">
            <div class="info-message prenomina-info success-info">
              ✅ <strong>¡Archivo descargado!</strong> Se generó el archivo de prenómina con las horas del consolidado.
              <br>La plantilla original quedó limpia para el próximo mes.
            </div>

            <div class="prenomina-stats">
              <div class="stat-item encontrados">
                <span class="stat-numero">{{ (horasPrenomina as any).actualizados || 0 }}</span>
                <span class="stat-label">Actualizados</span>
              </div>
              <div class="stat-item no-encontrados">
                <span class="stat-numero">{{ (horasPrenomina as any).noEncontrados || 0 }}</span>
                <span class="stat-label">No encontrados</span>
              </div>
              <div class="stat-item total-stat">
                <span class="stat-numero">{{ (horasPrenomina as any).total || comparacionPrenomina.length }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>

            <table class="prenomina-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>RUC</th>
                  <th>Horas Escritas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in comparacionPrenomina"
                  :key="item.trabajadorId"
                  :class="{
                    'row-coincide': item.encontrado,
                    'row-no-encontrado': !item.encontrado
                  }"
                >
                  <td class="numero">{{ index + 1 }}</td>
                  <td class="nombre">{{ item.nombre }}</td>
                  <td class="ruc">{{ item.ruc || '-' }}</td>
                  <td class="horas">{{ item.horasConsolidado }}h</td>
                  <td class="estado">
                    <span v-if="item.encontrado" class="estado-ok">✅ Escrito</span>
                    <span v-else class="estado-error">❌ No encontrado</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="no-prenomina">
            <span class="error-icon">⚠️</span>
            <p>No se pudieron escribir los datos en prenómina.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cerrarModalPrenomina" class="btn-cerrar">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReporteConsolidadoService from '@/services/ReporteConsolidadoService'
import TrabajadoresExcedidosService from '@/services/TrabajadoresExcedidosService'
import type { ReporteConsolidado } from '@/types/ReporteConsolidado'
import type { TrabajadorExcedido } from '@/services/TrabajadoresExcedidosService'

// Estado
const isLoading = ref(false)
const consultado = ref(false)
const reporteData = ref<ReporteConsolidado | null>(null)

// Modal de trabajadores excedidos
const mostrarModalExcedidos = ref(false)
const isLoadingExcedidos = ref(false)
const trabajadoresExcedidos = ref<TrabajadorExcedido[]>([])

// Modal de trabajadores faltantes
const mostrarModalFaltantes = ref(false)
const isLoadingFaltantes = ref(false)
const trabajadoresFaltantes = ref<any[]>([])

// Modal de trabajadores con menos de 8 horas
const mostrarModalMenor8 = ref(false)
const trabajadoresMenor8 = ref<any[]>([])

// Modal de prenómina
const mostrarModalPrenomina = ref(false)
const isLoadingPrenomina = ref(false)
const horasPrenomina = ref<Record<string, number>>({})
const comparacionPrenomina = ref<any[]>([])

// Filtros
const yearSeleccionado = ref(new Date().getFullYear().toString())
const mesSeleccionado = ref('')

// Lista de años (5 años atrás y 1 adelante)
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    yearsList.push(i.toString())
  }
  return yearsList
})

// Lista de meses
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Días del mes
const diasDelMes = computed(() => {
  if (!reporteData.value) return Array.from({ length: 31 }, (_, i) => i + 1)
  
  const year = parseInt(yearSeleccionado.value)
  const mesIndex = meses.indexOf(mesSeleccionado.value) + 1
  const days = new Date(year, mesIndex, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

// Fecha actual
const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Obtener inicial del día de la semana
const getDiaSemanaBrev = (dia: number): string => {
  if (!mesSeleccionado.value || !yearSeleccionado.value) return ''
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const mesIndex = meses.indexOf(mesSeleccionado.value) + 1
  const date = new Date(parseInt(yearSeleccionado.value), mesIndex - 1, dia)
  const dayOfWeek = date.getDay()
  const diasBrev = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  return diasBrev[dayOfWeek]
}

// Detectar si es sábado
const esSabado = (dia: number): boolean => {
  if (!mesSeleccionado.value || !yearSeleccionado.value) return false
  const mesIndex = meses.indexOf(mesSeleccionado.value) + 1
  const date = new Date(parseInt(yearSeleccionado.value), mesIndex - 1, dia)
  return date.getDay() === 6
}

// Detectar si es domingo
const esDomingo = (dia: number): boolean => {
  if (!mesSeleccionado.value || !yearSeleccionado.value) return false
  const mesIndex = meses.indexOf(mesSeleccionado.value) + 1
  const date = new Date(parseInt(yearSeleccionado.value), mesIndex - 1, dia)
  return date.getDay() === 0
}

// Consultar reporte
const consultar = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    alert('Seleccione un año y un mes para consultar')
    return
  }

  isLoading.value = true
  consultado.value = true
  reporteData.value = null

  try {
    const response = await ReporteConsolidadoService.obtenerReporteConsolidado(
      yearSeleccionado.value,
      mesSeleccionado.value
    )
    reporteData.value = response.data
    console.log('Reporte consolidado:', reporteData.value)
  } catch (error) {
    console.error('Error al obtener el reporte consolidado:', error)
    alert('Error al consultar el reporte. Por favor, intente de nuevo.')
  } finally {
    isLoading.value = false
  }
}

// Exportar a PDF
const exportarPdf = async () => {
  if (!reporteData.value) return

  try {
    const response = await ReporteConsolidadoService.exportarPdfConsolidado(
      yearSeleccionado.value,
      mesSeleccionado.value
    )

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_consolidado_${yearSeleccionado.value}_${mesSeleccionado.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    alert('Error al exportar el reporte a PDF')
  }
}

// Trabajadores con horas excedidas
const verTrabajadoresExcedidos = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    alert('Seleccione un año y un mes para consultar')
    return
  }

  isLoadingExcedidos.value = true
  mostrarModalExcedidos.value = true

  try {
    const response = await TrabajadoresExcedidosService.obtenerTrabajadoresConHorasExcedidas(
      yearSeleccionado.value,
      mesSeleccionado.value
    )
    trabajadoresExcedidos.value = response.data.items
    console.log('Trabajadores excedidos:', trabajadoresExcedidos.value)
  } catch (error) {
    console.error('Error al obtener trabajadores excedidos:', error)
    alert('Error al consultar trabajadores con horas excedidas.')
  } finally {
    isLoadingExcedidos.value = false
  }
}

const cerrarModalExcedidos = () => {
  mostrarModalExcedidos.value = false
  trabajadoresExcedidos.value = []
}

// Trabajadores no reportados en el consolidado
const verTrabajadoresFaltantes = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    alert('Seleccione un año y un mes para consultar')
    return
  }

  isLoadingFaltantes.value = true
  mostrarModalFaltantes.value = true

  try {
    const response = await fetch(
      `/api/reporte/consolidado/trabajadores-faltantes?year=${yearSeleccionado.value}&mes=${mesSeleccionado.value}`
    )

    if (!response.ok) {
      throw new Error('Error al obtener trabajadores faltantes')
    }

    const data = await response.json()
    trabajadoresFaltantes.value = data.items || []
    console.log('Trabajadores faltantes:', trabajadoresFaltantes.value)
  } catch (error) {
    console.error('Error al obtener trabajadores faltantes:', error)
    alert('Error al consultar trabajadores no reportados.')
  } finally {
    isLoadingFaltantes.value = false
  }
}

const cerrarModalFaltantes = () => {
  mostrarModalFaltantes.value = false
  trabajadoresFaltantes.value = []
}

// Trabajadores con menos de 8 horas
const verTrabajadoresMenor8Horas = () => {
  if (!reporteData.value || !reporteData.value.trabajadores) return

  const trabajadoresConMenor8: any[] = []

  reporteData.value.trabajadores.forEach((trabajador) => {
    const diasMenor8: any[] = []

    Object.entries(trabajador.horasPorDia).forEach(([dia, horas]) => {
      const horasNum = parseInt(String(horas), 10)
      if (horasNum > 0 && horasNum < 8) {
        diasMenor8.push({
          dia: `Día ${dia}`,
          horas: horasNum
        })
      }
    })

    if (diasMenor8.length > 0) {
      trabajadoresConMenor8.push({
        trabajadorId: trabajador.trabajadorId,
        nombre: trabajador.nombre,
        cargo: trabajador.cargo,
        diasMenor8: diasMenor8
      })
    }
  })

  trabajadoresMenor8.value = trabajadoresConMenor8
  mostrarModalMenor8.value = true
}

const cerrarModalMenor8 = () => {
  mostrarModalMenor8.value = false
  trabajadoresMenor8.value = []
}

// Escribir horas del consolidado en el Excel de prenómina y descargar
const cargarHorasPrenomina = async () => {
  if (!reporteData.value || !reporteData.value.trabajadores) {
    alert('Primero consulte un reporte consolidado')
    return
  }

  // Confirmar antes de escribir
  if (!confirm('¿Está seguro de generar el archivo de prenómina con las horas del consolidado?\n\nSe descargará un archivo Excel con las horas de cada trabajador.')) {
    return
  }

  isLoadingPrenomina.value = true
  mostrarModalPrenomina.value = true

  try {
    // Preparar el mapa RUC -> Horas del consolidado
    const horasPorRuc: Record<string, number> = {}

    reporteData.value.trabajadores.forEach((trabajador) => {
      if (trabajador.ruc) {
        horasPorRuc[trabajador.ruc] = trabajador.totalHoras || 0
      }
    })

    console.log('Enviando horas al backend:', horasPorRuc)

    // Nombre del archivo con año y mes
    const nombreArchivo = `PRENOMINA_${mesSeleccionado.value}_${yearSeleccionado.value}`

    // Enviar al backend para escribir en el Excel
    const response = await fetch(`/api/reporte/consolidado/escribir-prenomina?nombreArchivo=${encodeURIComponent(nombreArchivo)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(horasPorRuc)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al escribir en el archivo de prenómina')
    }

    // Obtener estadísticas de los headers
    const actualizados = parseInt(response.headers.get('X-Actualizados') || '0')
    const noEncontrados = parseInt(response.headers.get('X-No-Encontrados') || '0')
    const total = parseInt(response.headers.get('X-Total') || '0')

    // Descargar el archivo
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${nombreArchivo}.xls`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Mostrar resultados en el modal
    const resultados: any[] = []

    // Determinar cuáles fueron actualizados basándose en si tienen RUC
    reporteData.value.trabajadores.forEach((trabajador) => {
      const ruc = trabajador.ruc
      const horasConsolidado = trabajador.totalHoras || 0

      resultados.push({
        trabajadorId: trabajador.trabajadorId,
        nombre: trabajador.nombre,
        ruc: ruc,
        cargo: trabajador.cargo,
        horasConsolidado: horasConsolidado,
        encontrado: !!ruc // Asumimos que si tiene RUC, probablemente se encontró
      })
    })

    // Ordenar por nombre
    resultados.sort((a, b) => a.nombre.localeCompare(b.nombre))

    comparacionPrenomina.value = resultados

    // Guardar estadísticas para mostrar
    horasPrenomina.value = {
      actualizados: actualizados,
      noEncontrados: noEncontrados,
      total: total
    } as any

    console.log('Archivo descargado. Actualizados:', actualizados, 'No encontrados:', noEncontrados)

  } catch (error) {
    console.error('Error al escribir en prenómina:', error)
    alert('Error al generar el archivo de prenómina. Verifique que el archivo Excel plantilla exista.')
    mostrarModalPrenomina.value = false
  } finally {
    isLoadingPrenomina.value = false
  }
}

const cerrarModalPrenomina = () => {
  mostrarModalPrenomina.value = false
  comparacionPrenomina.value = []
}

// Inicializar con el mes actual
onMounted(() => {
  const fecha = new Date()
  const mesActual = meses[fecha.getMonth()]
  mesSeleccionado.value = mesActual
  yearSeleccionado.value = fecha.getFullYear().toString()
  consultar()
})
</script>

<style scoped>
.reporte-consolidado {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
  background: linear-gradient(180deg, #f8faf9 0%, #f0f4f2 100%);
  min-height: 100vh;
}

h2 {
  text-align: center;
  color: #1b5e20;
  margin-bottom: 25px;
  font-size: 1.8em;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

h2::before {
  content: '📊';
}

/* Filtros */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  padding: 20px 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
  border: 1px solid #e0e8e4;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-weight: 700;
  color: #2E7D5B;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #d4e4d9;
  border-radius: 8px;
  font-size: 1em;
  background: linear-gradient(180deg, #fff 0%, #f8faf9 100%);
  transition: all 0.3s ease;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #2E7D5B;
  box-shadow: 0 0 0 3px rgba(74, 124, 89, 0.15);
}

.filter-select:hover {
  border-color: #2E7D5B;
}

.filter-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 200px;
}

.btn-consultar {
  padding: 12px 20px;
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(74, 124, 89, 0.3);
}

.btn-consultar:hover:not(:disabled) {
  background: linear-gradient(180deg, #3A8E6A 0%, #2E7D5B 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(74, 124, 89, 0.4);
}

.btn-consultar:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-pdf {
  padding: 12px 20px;
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
}

.btn-pdf:hover:not(:disabled) {
  background: linear-gradient(180deg, #f05e50 0%, #e74c3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
}

.btn-pdf:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-excedidos {
  padding: 12px 20px;
  background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
}

.btn-excedidos:hover:not(:disabled) {
  background: linear-gradient(180deg, #f5ab35 0%, #f39c12 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(243, 156, 18, 0.4);
}

.btn-excedidos:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-faltantes {
  padding: 12px 20px;
  background: linear-gradient(180deg, #1abc9c 0%, #16a085 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(26, 188, 156, 0.3);
}

.btn-faltantes:hover:not(:disabled) {
  background: linear-gradient(180deg, #2ecfab 0%, #1abc9c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(26, 188, 156, 0.4);
}

.btn-faltantes:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-menor8 {
  padding: 12px 20px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.btn-menor8:hover:not(:disabled) {
  background: linear-gradient(180deg, #52a8e8 0%, #3498db 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.btn-menor8:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-evaluaciones {
  padding: 12px 20px;
  background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(155, 89, 182, 0.3);
}

.btn-evaluaciones:hover:not(.disabled) {
  background: linear-gradient(180deg, #af6ec8 0%, #9b59b6 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(155, 89, 182, 0.4);
}

.btn-evaluaciones.disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
}

/* Reportes Estratégicos */
.reportes-estrategicos {
  background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e8e4;
}

.reportes-estrategicos h3 {
  margin: 0 0 20px 0;
  color: #1b5e20;
  font-size: 1.3em;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8f0eb;
}

.reportes-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
}

.reporte-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px;
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.reporte-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.reporte-btn.ausentismo {
  border-left: 5px solid #e74c3c;
}

.reporte-btn.ausentismo:hover {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
  border-color: #e74c3c;
}

.reporte-btn.productividad {
  border-left: 5px solid #f39c12;
}

.reporte-btn.productividad:hover {
  background: linear-gradient(135deg, #fffbf0 0%, #fff3d9 100%);
  border-color: #f39c12;
}

.reporte-btn.rankings {
  border-left: 5px solid #9b59b6;
}

.reporte-btn.rankings:hover {
  background: linear-gradient(135deg, #faf5fc 0%, #f3e8f7 100%);
  border-color: #9b59b6;
}

.reporte-btn.excedidas {
  border-left: 5px solid #e67e22;
}

.reporte-btn.excedidas:hover {
  background: linear-gradient(135deg, #fffaf5 0%, #fff0e0 100%);
  border-color: #e67e22;
}

.btn-icon {
  font-size: 2em;
  min-width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.btn-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-text strong {
  color: #2c3e50;
  font-size: 1em;
  font-weight: 700;
}

.btn-text span {
  color: #7f8c8d;
  font-size: 0.85em;
}

/* Loading */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: #2E7D5B;
  background: linear-gradient(135deg, #fff 0%, #f8faf9 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.loading p {
  font-weight: 600;
  font-size: 1.1em;
}

.spinner {
  border: 5px solid #e8f0eb;
  border-top: 5px solid #2E7D5B;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 25px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Inicial y Sin Datos */
.inicial,
.no-data {
  text-align: center;
  padding: 80px 20px;
  color: #7f8c8d;
  background: linear-gradient(135deg, #fff 0%, #f8faf9 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  border: 1px solid #e0e8e4;
}

.inicial p,
.no-data p {
  font-size: 1.1em;
  font-weight: 500;
}

.empty-icon {
  font-size: 5em;
  display: block;
  margin-bottom: 20px;
  filter: grayscale(30%);
}

.no-data .subtext {
  font-size: 0.95em;
  color: #aaa;
  margin-top: 8px;
}

/* Reporte */
.reporte-container {
  background: linear-gradient(180deg, #fff 0%, #f8faf9 100%);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e0e8e4;
}

.reporte-header {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #2E7D5B 0%, #256B4D 100%);
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.3);
}

.reporte-header h3 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 1.6em;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.reporte-header p {
  margin: 5px 0;
  color: rgba(255,255,255,0.9);
  font-size: 1em;
}

.reporte-header p strong {
  color: #fff;
}

/* Tabla */
.table-responsive {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  background: #fff;
}

.reporte-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  min-width: 800px;
}

.reporte-table th,
.reporte-table td {
  border: 1px solid #c8d6cf;
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
}

.reporte-table thead th {
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 50%, #2f5a3c 100%);
  font-weight: 600;
  color: #fff;
  font-size: 0.75em;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  border: 1px solid #2f5a3c;
}

.header-numero {
  min-width: 35px;
  max-width: 35px;
  text-align: center !important;
  padding: 6px 4px !important;
  background: linear-gradient(180deg, #3A8E6A 0%, #2E7D5B 100%) !important;
}

.header-nombre {
  min-width: 150px;
  text-align: left !important;
  padding: 6px 8px !important;
  background: linear-gradient(180deg, #3A8E6A 0%, #2E7D5B 100%) !important;
}

.header-dias {
  text-align: center;
  padding: 6px 4px !important;
}

.header-dia-semana {
  text-align: center;
  padding: 4px 2px !important;
  font-weight: 600;
  font-size: 0.75em;
  background: linear-gradient(180deg, #3A8E6A 0%, #2E7D5B 100%) !important;
}

.dia-col {
  min-width: 28px;
  padding: 4px 2px !important;
  background: linear-gradient(180deg, #4A9E7A 0%, #3A8E6A 100%) !important;
}

.header-total {
  min-width: 50px;
  padding: 6px 4px !important;
  background: #3A8E6A !important;
}

.row-number {
  font-weight: 700;
  color: #2E7D5B;
  min-width: 35px;
  max-width: 35px;
  text-align: center !important;
  background: linear-gradient(180deg, #f8faf9 0%, #e8f0eb 100%);
}

.nombre-col {
  text-align: left !important;
  padding: 6px 10px !important;
  min-width: 200px;
  background: linear-gradient(90deg, #f8faf9 0%, #fff 100%);
}

.nombre-col strong {
  color: #2c3e50;
  font-size: 0.95em;
}

.nombre-col .subtext {
  display: block;
  font-size: 0.75em;
  color: #7f8c8d;
  font-weight: 500;
  margin-top: 2px;
}

/* === SÁBADOS Y DOMINGOS HEADERS === */
.dia-sabado {
  background: linear-gradient(180deg, #2E7D5B 0%, #3A8E6A 100%) !important;
}

.dia-domingo {
  background: linear-gradient(180deg, #ef5350 0%, #e53935 100%) !important;
}

.total-col {
  font-weight: 700;
  color: #fff;
  padding: 4px 6px !important;
  min-width: 50px;
  background: linear-gradient(180deg, #e67e22 0%, #d35400 100%) !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.total-horas {
  font-size: 1.05em;
  font-weight: 800;
}

/* === CELDAS DIVIDIDAS === */
.celda-dividida {
  padding: 0 !important;
  min-width: 36px;
  vertical-align: top;
  height: 40px;
}

.celda-contenido {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 40px;
}

.celda-horas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  min-height: 20px;
  font-size: 0.8em;
  font-weight: 600;
  color: #aaa;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.celda-horas.tiene-valor {
  color: #2c3e50;
  background: #E3F0E8;
  font-weight: 700;
}

.celda-norma {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  min-height: 18px;
  font-size: 0.7em;
  font-weight: 600;
  color: #bbb;
  background: #f5f5f5;
}

.celda-norma.tiene-valor {
  color: #666;
  background: #fff8e1;
}

/* Sábados en celdas divididas */
.celda-sabado .celda-horas {
  background: #fcfcfc !important;
}

.celda-sabado .celda-horas.tiene-valor {
  background: #fcfcfc !important;
  color: #000;
}

.celda-sabado .celda-norma {
  background: #fcfcfc !important;
}

.celda-sabado .celda-norma.tiene-valor {
  background: #fcfcfc !important;
  color: #000;
}

/* Domingos en celdas divididas */
.celda-domingo .celda-horas {
  background: #fef5f5 !important;
}

.celda-domingo .celda-horas.tiene-valor {
  background: #fdeaea !important;
  color: #c62828;
}

.celda-domingo .celda-norma {
  background: #fff8f8 !important;
}

.celda-domingo .celda-norma.tiene-valor {
  background: #fdf0f0 !important;
  color: #e57373;
}

/* Header Total Doble */
.header-total-doble {
  min-width: 60px !important;
  padding: 0 !important;
}

.total-header-split {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.total-label-horas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #3A8E6A;
  font-size: 0.7em;
  font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.total-label-norma {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #4A9E7A;
  font-size: 0.7em;
  font-weight: 700;
}

/* Total Col Doble */
.total-col-doble {
  padding: 0 !important;
  min-width: 60px;
  vertical-align: middle;
}

.total-contenido {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.total-contenido .total-horas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 0.9em;
  font-weight: 700;
  color: #fff;
  background: #3A8E6A;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.total-contenido .total-norma {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 0.85em;
  font-weight: 600;
  color: #fff;
  background: #4A9E7A;
}

.reporte-table tbody tr:nth-child(even) {
  background-color: rgba(74, 124, 89, 0.03);
}

.reporte-table tbody tr:nth-child(even) .hora-llena {
  background: linear-gradient(180deg, #d4edda 0%, #b8d9bd 100%);
}

.reporte-table tbody tr:hover {
  background-color: rgba(52, 152, 219, 0.08);
}

.reporte-table tbody tr:hover .nombre-col {
  background: linear-gradient(90deg, #e8f4fc 0%, #fff 100%);
}

.reporte-table tbody tr:hover .hora-llena {
  background: linear-gradient(180deg, #d6eaf8 0%, #aed6f1 100%);
}

.reporte-footer {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f8faf9 0%, #e8f0eb 100%);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  color: #555;
  font-size: 0.9em;
  border: 1px solid #d4e4d9;
}

.reporte-footer p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.reporte-footer p strong {
  color: #2E7D5B;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .filter-actions {
    flex-direction: row;
    flex-wrap: wrap;
    min-width: 100%;
  }

  .btn-consultar,
  .btn-pdf,
  .btn-excedidos,
  .btn-faltantes,
  .btn-evaluaciones {
    flex: 1;
    min-width: 140px;
  }

  .reporte-table {
    font-size: 0.7em;
    min-width: 600px;
  }

  .reporte-table th,
  .reporte-table td {
    padding: 3px 4px;
  }

  .header-nombre {
    min-width: 100px;
  }

  .nombre-col {
    min-width: 120px;
  }

  .dia-col,
  .hora-col {
    min-width: 20px;
    padding: 2px 1px !important;
  }

  .header-total,
  .total-col {
    min-width: 35px;
  }

  .reporte-header h3 {
    font-size: 1.2em;
  }

  .reporte-footer {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .reportes-buttons {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .reporte-btn {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .btn-icon {
    font-size: 2em;
  }

  .btn-text strong {
    font-size: 0.9em;
  }

  .btn-text span {
    font-size: 0.8em;
  }
}

@media (max-width: 480px) {
  .reporte-table {
    font-size: 0.6em;
    min-width: 500px;
  }

  .nombre-col {
    min-width: 80px;
  }

  .header-nombre {
    min-width: 80px;
  }

  .reporte-header p {
    font-size: 0.85em;
  }

  .filter-actions {
    flex-direction: column;
  }

  .btn-consultar,
  .btn-pdf,
  .btn-excedidos,
  .btn-faltantes,
  .btn-evaluaciones {
    width: 100%;
  }

  .reportes-buttons {
    grid-template-columns: 1fr;
  }

  .reporte-btn {
    flex-direction: row;
  }
}

/* ============ MODAL TRABAJADORES EXCEDIDOS ============ */
.modal-overlay {
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

.modal-excedidos {
  background-color: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
}

.modal-faltantes {
  background-color: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: none;
  background: linear-gradient(135deg, #2E7D5B 0%, #256B4D 100%);
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4em;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.btn-close {
  background: rgba(255,255,255,0.15);
  border: none;
  cursor: pointer;
  font-size: 1.3em;
  color: #fff;
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255,255,255,0.25);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
}

.loading-modal {
  text-align: center;
  padding: 60px 20px;
  color: #2E7D5B;
}

.loading-modal p {
  font-weight: 600;
  font-size: 1em;
}

.spinner-small {
  border: 4px solid #e8f0eb;
  border-top: 4px solid #2E7D5B;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

.info-message {
  background: linear-gradient(135deg, #fff8e1 0%, #fffacd 100%);
  border-left: 5px solid #f39c12;
  padding: 15px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 0.95em;
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.15);
}

.excedidos-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faltantes-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faltantes-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.faltantes-table thead {
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 100%);
}

.faltantes-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  color: #fff;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.faltantes-table tbody tr {
  border-bottom: 1px solid #e8f0eb;
  transition: all 0.2s ease;
}

.faltantes-table tbody tr:nth-child(even) {
  background-color: rgba(74, 124, 89, 0.03);
}

.faltantes-table tbody tr:hover {
  background-color: rgba(74, 124, 89, 0.08);
}

.faltantes-table td {
  padding: 14px 16px;
  color: #555;
  font-size: 0.9em;
}

.faltantes-table .numero {
  font-weight: 700;
  color: #2E7D5B;
  width: 40px;
}

.faltantes-table .nombre {
  font-weight: 600;
  color: #2c3e50;
}

.faltantes-table .ruc,
.faltantes-table .cuenta {
  color: #7f8c8d;
  font-family: monospace;
}

.faltantes-table .cargo {
  color: #7f8c8d;
  font-size: 0.85em;
  font-style: italic;
}

.no-faltantes {
  text-align: center;
  padding: 50px 20px;
  color: #7f8c8d;
}

.no-faltantes p {
  font-size: 1.05em;
}

.info-message.warning {
  background-color: #fff3cd;
  border-left-color: #1abc9c;
  color: #856404;
}

.trabajador-excedido {
  border: 1px solid #e0e8e4;
  border-radius: 12px;
  padding: 18px;
  background: linear-gradient(135deg, #fff 0%, #f8faf9 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.trabajador-excedido:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.trabajador-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8f0eb;
}

.trabajador-info h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.15em;
  font-weight: 700;
}

.subinfo {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 0.85em;
}

.excedidos-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85em;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
}

.dias-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.dias-table th,
.dias-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e8f0eb;
}

.dias-table th {
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 100%);
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  font-size: 0.8em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.dias-table tbody tr:nth-child(even) {
  background-color: rgba(74, 124, 89, 0.03);
}

.dias-table tbody tr:hover {
  background-color: rgba(74, 124, 89, 0.08);
}

.fecha-col {
  font-weight: 600;
  color: #2c3e50;
}

.horas-col {
  color: #e74c3c;
  font-weight: 700;
}

.exceso-col {
  color: #c0392b;
  font-weight: 800;
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.1) 0%, transparent 100%);
}

.no-excedidos {
  text-align: center;
  padding: 50px 20px;
  color: #7f8c8d;
}

.no-excedidos p {
  font-size: 1.05em;
}

.success-icon {
  font-size: 4em;
  display: block;
  margin-bottom: 20px;
  color: #2E7D5B;
}

.modal-footer {
  padding: 18px 25px;
  border-top: 1px solid #e8f0eb;
  background: linear-gradient(180deg, #f8faf9 0%, #e8f0eb 100%);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cerrar {
  padding: 10px 28px;
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(74, 124, 89, 0.3);
}

.btn-cerrar:hover {
  background: linear-gradient(180deg, #3A8E6A 0%, #2E7D5B 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(74, 124, 89, 0.4);
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

/* ============ MODAL TRABAJADORES CON MENOS DE 8 HORAS ============ */
.modal-menor8 {
  background-color: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
}

.menor8-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trabajador-menor8 {
  border: 1px solid #e0e8e4;
  border-radius: 12px;
  padding: 18px;
  background: linear-gradient(135deg, #fff 0%, #f8faf9 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.trabajador-menor8:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.dias-badge {
  display: inline-block;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85em;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.horas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.horas-table th,
.horas-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e8f0eb;
}

.horas-table th {
  background: linear-gradient(180deg, #2E7D5B 0%, #256B4D 100%);
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  font-size: 0.8em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.horas-table tbody tr:nth-child(even) {
  background-color: rgba(74, 124, 89, 0.03);
}

.horas-table tbody tr:hover {
  background-color: rgba(74, 124, 89, 0.08);
}

.horas-table .dia-col {
  font-weight: 600;
  color: #2c3e50;
}

.horas-table .horas-col {
  color: #3498db;
  font-weight: 700;
}

.diferencia-col {
  color: #e74c3c;
  font-weight: 800;
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.1) 0%, transparent 100%);
}

.no-menor8 {
  text-align: center;
  padding: 50px 20px;
  color: #7f8c8d;
}

.no-menor8 p {
  font-size: 1.05em;
}

/* ============ BOTÓN PRENÓMINA ============ */
.btn-prenomina {
  padding: 12px 20px;
  background: linear-gradient(180deg, #8e44ad 0%, #7d3c98 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(142, 68, 173, 0.3);
}

.btn-prenomina:hover:not(:disabled) {
  background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(142, 68, 173, 0.4);
}

.btn-prenomina:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

/* ============ MODAL PRENÓMINA ============ */
.modal-prenomina {
  background-color: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
}

.prenomina-header {
  background: linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%) !important;
}

.prenomina-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prenomina-info {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%) !important;
  border-left-color: #8e44ad !important;
  color: #4a235a !important;
}

.prenomina-stats {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 25px;
  border-radius: 10px;
  min-width: 100px;
}

.stat-item.encontrados {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
}

.stat-item.no-encontrados {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border: 2px solid #e74c3c;
}

.stat-item.coinciden {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
}

.stat-numero {
  font-size: 2em;
  font-weight: 800;
  color: #2c3e50;
}

.stat-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
}

.prenomina-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.prenomina-table thead {
  background: linear-gradient(180deg, #8e44ad 0%, #7d3c98 100%);
}

.prenomina-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  color: #fff;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.prenomina-table tbody tr {
  border-bottom: 1px solid #e8f0eb;
  transition: all 0.2s ease;
}

.prenomina-table td {
  padding: 12px 16px;
  color: #555;
  font-size: 0.9em;
}

.prenomina-table .numero {
  font-weight: 700;
  color: #8e44ad;
  width: 40px;
}

.prenomina-table .nombre {
  font-weight: 600;
  color: #2c3e50;
}

.prenomina-table .ruc {
  color: #7f8c8d;
  font-family: monospace;
}

.prenomina-table .horas {
  font-weight: 700;
  text-align: center;
}

.prenomina-table .diferencia {
  font-weight: 800;
  text-align: center;
}

.prenomina-table .diferencia.positiva {
  color: #27ae60;
  background: linear-gradient(90deg, rgba(39, 174, 96, 0.1) 0%, transparent 100%);
}

.prenomina-table .diferencia.negativa {
  color: #e74c3c;
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.1) 0%, transparent 100%);
}

.row-coincide {
  background: linear-gradient(90deg, rgba(39, 174, 96, 0.08) 0%, transparent 100%) !important;
}

.row-diferencia {
  background: linear-gradient(90deg, rgba(243, 156, 18, 0.08) 0%, transparent 100%) !important;
}

.row-no-encontrado {
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.08) 0%, transparent 100%) !important;
}

.row-no-encontrado td {
  color: #999 !important;
}

.success-info {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%) !important;
  border-left-color: #4caf50 !important;
  color: #2e7d32 !important;
}

.stat-item.total-stat {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border: 2px solid #8e44ad;
}

.estado {
  text-align: center;
  font-weight: 600;
}

.estado-ok {
  color: #27ae60;
}

.estado-error {
  color: #e74c3c;
}

.no-prenomina {
  text-align: center;
  padding: 50px 20px;
  color: #7f8c8d;
}

.error-icon {
  font-size: 4em;
  display: block;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .modal-excedidos,
  .modal-faltantes,
  .modal-menor8,
  .modal-prenomina {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .btn-close {
    align-self: flex-end;
  }

  .trabajador-header {
    flex-direction: column;
    gap: 10px;
  }

  .excedidos-badge,
  .dias-badge {
    align-self: flex-start;
  }

  .dias-table,
  .horas-table {
    font-size: 0.8em;
  }

  .dias-table th,
  .dias-table td,
  .horas-table th,
  .horas-table td {
    padding: 6px 10px;
  }
}
</style>