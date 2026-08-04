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
              <th v-for="dia in diasDelMes" :key="dia" class="header-dia-semana">
                {{ getDiaSemanaBrev(dia) }}
              </th>
              <th rowspan="2" class="header-total">Total<br>tiempo</th>
            </tr>
            <tr>
              <th v-for="dia in diasDelMes" :key="'num-' + dia" class="dia-col">
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
                class="hora-col"
                :class="{
                  'hora-vacia': !trabajador.horasPorDia[dia],
                  'hora-llena': trabajador.horasPorDia[dia]
                }"
              >
                {{ trabajador.horasPorDia[dia] || '' }}
              </td>
              <td class="total-col">
                <span class="total-horas">{{ trabajador.totalHoras || 0 }}</span>
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

/* Filtros */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 25px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9em;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  background: #fff;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.filter-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 200px;
}

.btn-consultar {
  padding: 10px 18px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-consultar:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-consultar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-pdf {
  padding: 10px 18px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-pdf:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-pdf:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-excedidos {
  padding: 10px 18px;
  background-color: #f39c12;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-excedidos:hover:not(:disabled) {
  background-color: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.btn-excedidos:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-faltantes {
  padding: 10px 18px;
  background-color: #1abc9c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-faltantes:hover:not(:disabled) {
  background-color: #16a085;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
}

.btn-faltantes:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-menor8 {
  padding: 10px 18px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-menor8:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-menor8:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-evaluaciones {
  padding: 10px 18px;
  background-color: #f39c12;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  white-space: nowrap;
}

.btn-evaluaciones:hover:not(.disabled) {
  background-color: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.btn-evaluaciones.disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  pointer-events: none;
}

/* Reportes Estratégicos */
.reportes-estrategicos {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.reportes-estrategicos h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3em;
  font-weight: 700;
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
  padding: 15px;
  background: white;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.reporte-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reporte-btn.ausentismo {
  border-left: 4px solid #e74c3c;
}

.reporte-btn.ausentismo:hover {
  background-color: #fadbd8;
}

.reporte-btn.productividad {
  border-left: 4px solid #f39c12;
}

.reporte-btn.productividad:hover {
  background-color: #fef5e7;
}

.reporte-btn.rankings {
  border-left: 4px solid #9b59b6;
}

.reporte-btn.rankings:hover {
  background-color: #f4ecf7;
}

.reporte-btn.excedidas {
  border-left: 4px solid #e67e22;
}

.reporte-btn.excedidas:hover {
  background-color: #fdebd0;
}

.btn-icon {
  font-size: 1.8em;
  min-width: 50px;
  text-align: center;
}

.btn-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-text strong {
  color: #2c3e50;
  font-size: 0.95em;
}

.btn-text span {
  color: #7f8c8d;
  font-size: 0.85em;
}

/* Loading */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Inicial y Sin Datos */
.inicial,
.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 4em;
  display: block;
  margin-bottom: 15px;
}

.no-data .subtext {
  font-size: 0.9em;
  color: #aaa;
  margin-top: 5px;
}

/* Reporte */
.reporte-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.reporte-header {
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 20px;
}

.reporte-header h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.5em;
  font-weight: 700;
}

.reporte-header p {
  margin: 5px 0;
  color: #666;
}

/* Tabla */
.table-responsive {
  overflow-x: auto;
}

.reporte-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  min-width: 800px;
}

.reporte-table th,
.reporte-table td {
  border: 1px solid #ddd;
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
}

.reporte-table thead th {
  background: #f0f0f0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.75em;
  text-transform: uppercase;
}

.header-numero {
  min-width: 35px;
  max-width: 35px;
  text-align: center !important;
  padding: 6px 4px !important;
}

.header-nombre {
  min-width: 150px;
  text-align: left !important;
  padding: 6px 8px !important;
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
}

.dia-col {
  min-width: 28px;
  padding: 4px 2px !important;
}

.header-total {
  min-width: 50px;
  padding: 6px 4px !important;
}

.row-number {
  font-weight: 600;
  color: #888;
  min-width: 35px;
  max-width: 35px;
  text-align: center !important;
}

.nombre-col {
  text-align: left !important;
  padding: 4px 8px !important;
  min-width: 200px;
}

.nombre-col .subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
  font-weight: 400;
}

.hora-col {
  font-size: 0.8em;
  padding: 4px 2px !important;
  min-width: 28px;
  font-weight: 500;
}

.hora-vacia {
  color: #ddd;
}

.hora-llena {
  color: #2c3e50;
  font-weight: 600;
}

.total-col {
  font-weight: 700;
  color: #e67e22;
  padding: 4px 6px !important;
  min-width: 50px;
}

.total-horas {
  font-size: 1em;
  font-weight: 700;
}

.reporte-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.reporte-table tbody tr:hover {
  background-color: #f0f7ff;
}

.reporte-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  color: #666;
  font-size: 0.9em;
}

.reporte-footer p {
  margin: 0;
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #fff8e1 0%, #fff 100%);
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3em;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5em;
  color: #888;
  transition: all 0.3s ease;
}

.btn-close:hover {
  color: #333;
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
  color: #888;
}

.info-message {
  background-color: #fffacd;
  border-left: 4px solid #f39c12;
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 0.95em;
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
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.faltantes-table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.faltantes-table th {
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
}

.faltantes-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.faltantes-table tbody tr:hover {
  background-color: #f8f9fa;
}

.faltantes-table td {
  padding: 12px 15px;
  color: #555;
  font-size: 0.9em;
}

.faltantes-table .numero {
  font-weight: 600;
  color: #3498db;
  width: 40px;
}

.faltantes-table .nombre {
  font-weight: 500;
  color: #2c3e50;
}

.faltantes-table .ruc,
.faltantes-table .cuenta {
  color: #888;
}

.faltantes-table .cargo {
  color: #888;
  font-size: 0.85em;
}

.no-faltantes {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.info-message.warning {
  background-color: #fff3cd;
  border-left-color: #1abc9c;
  color: #856404;
}

.trabajador-excedido {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.trabajador-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.trabajador-info h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.subinfo {
  margin: 4px 0 0 0;
  color: #888;
  font-size: 0.85em;
}

.excedidos-badge {
  display: inline-block;
  background-color: #f39c12;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
  white-space: nowrap;
}

.dias-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin-top: 10px;
}

.dias-table th,
.dias-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.dias-table th {
  background-color: #f0f0f0;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  font-size: 0.8em;
}

.fecha-col {
  font-weight: 500;
  color: #2c3e50;
}

.horas-col {
  color: #e74c3c;
  font-weight: 600;
}

.exceso-col {
  color: #c0392b;
  font-weight: 700;
}

.no-excedidos {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.success-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
}

.modal-footer {
  padding: 15px 25px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cerrar {
  padding: 8px 24px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cerrar:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.menor8-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trabajador-menor8 {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.dias-badge {
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
  white-space: nowrap;
}

.horas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin-top: 10px;
}

.horas-table th,
.horas-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.horas-table th {
  background-color: #f0f0f0;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  font-size: 0.8em;
}

.dia-col {
  font-weight: 500;
  color: #2c3e50;
}

.horas-col {
  color: #3498db;
  font-weight: 600;
}

.diferencia-col {
  color: #e74c3c;
  font-weight: 700;
}

.no-menor8 {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

@media (max-width: 768px) {
  .modal-excedidos,
  .modal-faltantes,
  .modal-menor8 {
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