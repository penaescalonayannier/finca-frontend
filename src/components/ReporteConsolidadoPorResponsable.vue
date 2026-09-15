<!-- src/components/ReporteConsolidadoPorResponsable.vue -->

<template>
  <div class="consolidado-responsable">
    <div class="header-section">
      <h2>📊 Consolidado por Responsable</h2>
      <p class="subtitle">Trabajadores agrupados por responsable del reporte</p>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <label for="year">Año</label>
        <select id="year" v-model="yearSeleccionado" class="filter-select" @change="consultar">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="mes">Mes</label>
        <select id="mes" v-model="mesSeleccionado" class="filter-select" @change="consultar">
          <option v-for="mes in meses" :key="mes" :value="mes">
            {{ mes }}
          </option>
        </select>
      </div>

      <div class="filter-actions">
        <button @click="consultar" class="btn-consultar" :disabled="isLoading">
          {{ isLoading ? 'Consultando...' : '🔍 Consultar' }}
        </button>
        <button
          @click="descargarPdf"
          class="btn-pdf"
          :disabled="isLoading || !consolidadoData"
        >
          📄 Descargar PDF
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando consolidado...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="consolidadoData && consolidadoData.responsables.length > 0" class="content">
      <div class="info-header">
        <span class="period">{{ mesSeleccionado }} {{ yearSeleccionado }}</span>
        <span class="total">Total responsables: {{ consolidadoData.responsables.length }}</span>
      </div>

      <div v-for="responsable in consolidadoData.responsables" :key="responsable.trabajadorResponsableId" class="responsable-section">
        <div class="responsable-header">
          <div class="responsable-info">
            <h3>{{ responsable.trabajadorResponsableNombre }}</h3>
            <span class="badge">{{ responsable.trabajadores.length }} trabajador{{ responsable.trabajadores.length !== 1 ? 'es' : '' }}</span>
          </div>
          <button
            @click="descargarPdfResponsable(responsable.trabajadorResponsableNombre)"
            class="btn-pdf-responsable"
            :disabled="isLoading"
            title="Descargar PDF de este responsable"
          >
            📥 Descargar PDF
          </button>
        </div>

        <div class="table-wrapper">
          <table class="consolidado-table">
            <thead>
              <tr class="header-row">
                <th rowspan="2" class="col-nombre">Trabajador</th>
                <th
                  v-for="dia in daysInMonth"
                  :key="dia"
                  class="header-dia-semana"
                  :class="{
                    'dia-sabado': esSabado(dia),
                    'dia-domingo': esDomingo(dia)
                  }"
                  :title="`Día ${dia}`"
                >
                  {{ getDiaSemanaBrev(dia) }}
                </th>
                <th rowspan="2" class="col-total-header">
                  <div class="total-header-split">
                    <span class="total-label-horas">Horas</span>
                    <span class="total-label-norma">Norma</span>
                  </div>
                </th>
              </tr>
              <tr class="header-row">
                <th
                  v-for="dia in daysInMonth"
                  :key="'num-' + dia"
                  class="col-dia-num"
                  :class="{
                    'dia-sabado': esSabado(dia),
                    'dia-domingo': esDomingo(dia)
                  }"
                  :title="`Día ${dia}`"
                >
                  {{ dia }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trabajador in responsable.trabajadores" :key="trabajador.trabajadorId" class="data-row">
                <td class="col-nombre">
                  <strong>{{ trabajador.nombre }}</strong>
                  <span class="cargo-subtexto">{{ trabajador.cargo || 'Sin cargo' }}</span>
                </td>
                <td
                  v-for="dia in daysInMonth"
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
                <td class="col-total-doble">
                  <div class="total-contenido">
                    <span class="total-horas">{{ trabajador.totalHoras.toFixed(1) }}</span>
                    <span class="total-norma">{{ trabajador.totalNorma?.toFixed(1) || '0' }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="footer-row">
                <td class="col-label">
                  <strong>Total por Día</strong>
                </td>
                <td
                  v-for="dia in daysInMonth"
                  :key="dia"
                  class="col-dia total-dia"
                  :class="{
                    'celda-sabado': esSabado(dia),
                    'celda-domingo': esDomingo(dia)
                  }"
                >
                  <strong>{{ calcularTotalDia(responsable.trabajadores, dia) }}</strong>
                </td>
                <td class="col-total total-general">
                  <strong>{{ calcularGrandTotal(responsable.trabajadores) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Pie de Firma -->
        <div class="firma-section">
          <div class="firma-container">
            <div class="firma-box">
              <div class="firma-linea"></div>
              <p class="firma-label">Firma del Responsable</p>
            </div>
            <div class="nombre-box">
              <p class="nombre-label">{{ responsable.trabajadorResponsableNombre }}</p>
            </div>
            <div class="fecha-box">
              <p class="fecha-label">Fecha: ________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else-if="!isLoading" class="no-data">
      <span class="empty-icon">📭</span>
      <p>No hay reportes para {{ mesSeleccionado }} {{ yearSeleccionado }}</p>
      <p class="hint">Selecciona un mes y año diferente para consultar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReporteConsolidadoService from '@/services/ReporteConsolidadoService'
import AuthService from '@/services/AuthService'
import type { ReporteConsolidadoPorResponsable } from '@/types/ReporteConsolidadoPorResponsable'
import type { AxiosError } from 'axios'

// Estado
const isLoading = ref(false)
const consolidadoData = ref<ReporteConsolidadoPorResponsable | null>(null)

// Obtener mes y año actual
const obtenerMesActual = (): string => {
  const now = new Date()
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses[now.getMonth()]
}

const obtenerYearActual = (): string => {
  return new Date().getFullYear().toString()
}

// Filtros
const yearSeleccionado = ref<string>(obtenerYearActual())
const mesSeleccionado = ref<string>(obtenerMesActual())

// Opciones - Años dinámicos
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    yearsList.push(i.toString())
  }
  return yearsList
})

const meses = ref([
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
])

// Computed
const daysInMonth = computed(() => {
  const monthMap: Record<string, number> = {
    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
  }
  const monthNum = monthMap[mesSeleccionado.value] || 1
  const year = parseInt(yearSeleccionado.value)
  return new Date(year, monthNum, 0).getDate()
})

// Mapa de meses
const monthMap: Record<string, number> = {
  'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
  'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
}

// Obtener inicial del día de la semana
const getDiaSemanaBrev = (dia: number): string => {
  const monthNum = monthMap[mesSeleccionado.value] || 1
  const date = new Date(parseInt(yearSeleccionado.value), monthNum - 1, dia)
  const dayOfWeek = date.getDay()
  const diasBrev = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  return diasBrev[dayOfWeek]
}

// Detectar si es sábado
const esSabado = (dia: number): boolean => {
  const monthNum = monthMap[mesSeleccionado.value] || 1
  const date = new Date(parseInt(yearSeleccionado.value), monthNum - 1, dia)
  return date.getDay() === 6
}

// Detectar si es domingo
const esDomingo = (dia: number): boolean => {
  const monthNum = monthMap[mesSeleccionado.value] || 1
  const date = new Date(parseInt(yearSeleccionado.value), monthNum - 1, dia)
  return date.getDay() === 0
}

// Métodos
const consultar = async () => {
  isLoading.value = true
  try {
    const response = await ReporteConsolidadoService.obtenerReporteConsolidadoPorResponsable(
      yearSeleccionado.value,
      mesSeleccionado.value
    )
    consolidadoData.value = response.data
  } catch (error) {
    console.error('Error al cargar consolidado:', error)
    const err = error as AxiosError
    alert(`Error: ${err.message}`)
    consolidadoData.value = null
  } finally {
    isLoading.value = false
  }
}

const calcularTotalDia = (trabajadores: any[], dia: number): string => {
  const total = trabajadores.reduce((sum, t) => {
    const horas = t.horasPorDia[dia]
    if (!horas) return sum
    try {
      return sum + parseFloat(horas)
    } catch {
      return sum
    }
  }, 0)
  return total > 0 ? total.toFixed(1) : '-'
}

const calcularGrandTotal = (trabajadores: any[]): string => {
  const total = trabajadores.reduce((sum, t) => sum + (t.totalHoras || 0), 0)
  return total.toFixed(1)
}

const descargarPdf = async () => {
  if (!consolidadoData.value) return

  try {
    isLoading.value = true

    const token = AuthService.getToken()
    const headers: Record<string, string> = {
      'Accept': 'application/pdf'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `/api/reporte/consolidado-por-responsable/pdf?year=${yearSeleccionado.value}&mes=${mesSeleccionado.value}`,
      {
        method: 'GET',
        headers
      }
    )

    if (!response.ok) {
      throw new Error(`Error al descargar PDF: ${response.statusText}`)
    }

    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_consolidado_responsable_${yearSeleccionado.value}_${mesSeleccionado.value}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    alert('Error al generar PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  } finally {
    isLoading.value = false
  }
}

const descargarPdfResponsable = async (nombreResponsable: string) => {
  try {
    isLoading.value = true

    const token = AuthService.getToken()
    const headers: Record<string, string> = {
      'Accept': 'application/pdf'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `/api/reporte/consolidado-por-responsable/pdf?year=${yearSeleccionado.value}&mes=${mesSeleccionado.value}`,
      {
        method: 'GET',
        headers
      }
    )

    if (!response.ok) {
      throw new Error(`Error al descargar PDF: ${response.statusText}`)
    }

    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_${nombreResponsable.replace(/\s+/g, '_')}_${yearSeleccionado.value}_${mesSeleccionado.value}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    alert('Error al generar PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  consultar()
})
</script>

<style scoped>
.consolidado-responsable {
  padding: 20px;
  background: linear-gradient(180deg, #f8faf9 0%, #f0f4f2 100%);
  min-height: 100vh;
}

.header-section {
  margin-bottom: 25px;
  text-align: center;
}

.header-section h2 {
  margin: 0 0 8px 0;
  color: #37474f;
  font-size: 1.8em;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.95em;
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
  min-width: 120px;
}

.filter-group label {
  font-weight: 700;
  color: #546e7a;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #cfd8dc;
  border-radius: 8px;
  font-size: 1em;
  background: linear-gradient(180deg, #fff 0%, #fafafa 100%);
  transition: all 0.3s ease;
  font-weight: 500;
  color: #37474f;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #78909c;
  box-shadow: 0 0 0 3px rgba(120, 144, 156, 0.15);
}

.filter-select:hover {
  border-color: #78909c;
}

.filter-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-consultar,
.btn-pdf {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.btn-consultar {
  background: linear-gradient(180deg, #607d8b 0%, #546e7a 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(96, 125, 139, 0.3);
}

.btn-consultar:hover:not(:disabled) {
  background: linear-gradient(180deg, #78909c 0%, #607d8b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(96, 125, 139, 0.4);
}

.btn-pdf {
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
}

.btn-pdf:hover:not(:disabled) {
  background: linear-gradient(180deg, #f05e50 0%, #e74c3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
}

.btn-consultar:disabled,
.btn-pdf:disabled {
  background: linear-gradient(180deg, #bdc3c7 0%, #a0a6a9 100%);
  cursor: not-allowed;
  box-shadow: none;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  border-radius: 16px;
  color: #607d8b;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.loading p {
  font-weight: 600;
  font-size: 1.1em;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #E3F0E8;
  border-top-color: #2E7D5B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 25px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Contenido */
.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #2E7D5B 0%, #3A8E6A 100%);
  padding: 18px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 187, 106, 0.3);
  margin-bottom: 10px;
}

.period {
  font-size: 1.2em;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.total {
  font-size: 0.95em;
  color: rgba(255,255,255,0.9);
}

/* Responsable Section */
.responsable-section {
  background: linear-gradient(180deg, #fff 0%, #f8faf9 100%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 25px;
  border: 1px solid #e0e8e4;
}

.responsable-header {
  padding: 18px 25px;
  background: linear-gradient(135deg, #2E7D5B 0%, #3A8E6A 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.responsable-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.responsable-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.15em;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.3);
}

.btn-pdf-responsable {
  padding: 10px 18px;
  background: rgba(255,255,255,0.15);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-pdf-responsable:hover:not(:disabled) {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-pdf-responsable:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tabla */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background: #fff;
  margin: 15px;
  margin-top: 20px;
}

.consolidado-table {
  width: 100%;
  border-collapse: collapse;
}

.consolidado-table thead {
  background: linear-gradient(180deg, #2E7D5B 0%, #3A8E6A 100%);
  color: white;
}

.consolidado-table th {
  padding: 10px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.8em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  border: 1px solid #256B4D;
}

.col-nombre {
  text-align: left !important;
  min-width: 180px;
  padding-left: 12px !important;
}

.col-dia-num {
  width: 36px;
  min-width: 36px;
  background: linear-gradient(180deg, #B8D8C5 0%, #2E7D5B 100%) !important;
}

.header-dia-semana {
  text-align: center;
  padding: 4px 2px !important;
  font-weight: 700;
  font-size: 0.75em;
  background: linear-gradient(180deg, #2E7D5B 0%, #3A8E6A 100%) !important;
}

/* Sábados y Domingos Headers */
.dia-sabado {
  background: linear-gradient(180deg, #2E7D5B 0%, #3A8E6A 100%) !important;
}

.dia-domingo {
  background: linear-gradient(180deg, #ef5350 0%, #e53935 100%) !important;
}

.col-total-header {
  min-width: 60px;
  padding: 0 !important;
  background: #3A8E6A !important;
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
  background: #2E7D5B;
  font-size: 0.7em;
  font-weight: 700;
}

.consolidado-table td {
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #e0e8e4;
  font-size: 0.85em;
}

.consolidado-table tbody tr:nth-child(even) {
  background-color: rgba(74, 124, 89, 0.03);
}

.consolidado-table tbody tr:hover {
  background-color: rgba(52, 152, 219, 0.08);
}

.consolidado-table .data-row .col-nombre {
  text-align: left;
  color: #2c3e50;
  background: linear-gradient(90deg, #f8faf9 0%, #fff 100%);
  vertical-align: middle;
}

.consolidado-table .data-row .col-nombre strong {
  font-size: 0.9em;
  display: block;
  line-height: 1.2;
}

.cargo-subtexto {
  display: block;
  font-size: 0.7em;
  color: #2E7D5B;
  font-weight: 500;
  margin-top: 2px;
}

/* === CELDAS DIVIDIDAS === */
.celda-dividida {
  padding: 0 !important;
  min-width: 40px;
  vertical-align: top;
  height: 50px;
}

.celda-contenido {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 50px;
}

.celda-horas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px;
  min-height: 25px;
  font-size: 0.85em;
  font-weight: 600;
  color: #ccc;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.celda-horas.tiene-valor {
  color: #555;
  background: #f5f9f6;
  font-weight: 700;
}

.celda-norma {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px;
  min-height: 22px;
  font-size: 0.75em;
  font-weight: 600;
  color: #ccc;
  background: #f8f8f8;
}

.celda-norma.tiene-valor {
  color: #777;
  background: #fafaf5;
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
  background: #fdf8f8 !important;
}

.celda-domingo .celda-horas.tiene-valor {
  background: #faf2f2 !important;
  color: #e57373;
}

.celda-domingo .celda-norma {
  background: #fefafa !important;
}

.celda-domingo .celda-norma.tiene-valor {
  background: #fcf5f5 !important;
  color: #ef9a9a;
}

/* Total Columna Doble */
.col-total-doble {
  padding: 0 !important;
  min-width: 65px;
  vertical-align: middle;
  height: 50px;
}

.total-contenido {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 50px;
}

.total-contenido .total-horas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  min-height: 25px;
  font-size: 0.95em;
  font-weight: 700;
  color: #fff;
  background: #3A8E6A;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}

.total-contenido .total-norma {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  min-height: 22px;
  font-size: 0.85em;
  font-weight: 600;
  color: #fff;
  background: #2E7D5B;
}

/* Footer */
.consolidado-table tfoot {
  font-weight: 600;
}

.consolidado-table .footer-row td {
  background: linear-gradient(180deg, #E3F0E8 0%, #B8D8C5 100%);
  border-top: 2px solid #2E7D5B;
  border-bottom: none;
  font-weight: 700;
  padding: 10px 8px;
  color: #1D5A3F;
}

.consolidado-table .col-label {
  text-align: left;
  padding-left: 12px !important;
}

.consolidado-table .total-dia {
  background: #f5f5f5 !important;
  color: #555;
  font-size: 0.85em;
}

.consolidado-table .total-general {
  background: #3A8E6A !important;
  color: #fff;
  font-size: 1em;
}

/* Sin datos */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, #fff 0%, #f8faf9 100%);
  border-radius: 16px;
  color: #7f8c8d;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  border: 1px solid #e0e8e4;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  filter: grayscale(30%);
}

.no-data p {
  margin: 10px 0;
  font-size: 1.1em;
  font-weight: 500;
}

.hint {
  font-size: 0.95em;
  color: #95a5a6;
  margin-top: 10px !important;
}

/* Firma Section */
.firma-section {
  padding: 30px 25px;
  background: linear-gradient(180deg, #fafafa 0%, #E3F0E8 100%);
  margin: 15px;
  margin-top: 0;
  border-radius: 12px;
  border: 1px solid #B8D8C5;
}

.firma-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.firma-box,
.nombre-box,
.fecha-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.firma-linea {
  width: 100%;
  height: 1px;
  background-color: #2E7D5B;
  margin-bottom: 10px;
  min-height: 60px;
  border-bottom: 2px solid #2E7D5B;
}

.firma-label,
.nombre-label,
.fecha-label {
  margin: 5px 0 0 0;
  font-size: 0.85em;
  color: #3A8E6A;
  font-weight: 700;
}

.nombre-label {
  border-bottom: 2px solid #2E7D5B;
  padding-bottom: 5px;
  min-width: 150px;
  color: #1D5A3F;
}

.fecha-label {
  font-size: 0.9em;
  color: #555;
  font-weight: 500;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    min-width: auto;
  }

  .filter-actions {
    flex-direction: column;
  }

  .btn-consultar,
  .btn-pdf {
    width: 100%;
  }

  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .responsable-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .responsable-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .btn-pdf-responsable {
    width: 100%;
  }

  .consolidado-table {
    font-size: 0.8em;
  }

  .consolidado-table th,
  .consolidado-table td {
    padding: 5px;
  }

  .col-dia {
    width: 25px;
  }

  .firma-container {
    grid-template-columns: 1fr;
    gap: 30px;
    max-width: 100%;
  }

  .firma-linea {
    min-height: 40px;
  }

  .firma-label,
  .nombre-label,
  .fecha-label {
    font-size: 0.8em;
  }
}
</style>
