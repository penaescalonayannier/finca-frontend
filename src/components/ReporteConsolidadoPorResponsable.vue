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
                <th rowspan="2" class="col-ruc">RUC</th>
                <th rowspan="2" class="col-cargo">Cargo</th>
                <th v-for="dia in daysInMonth" :key="dia" class="header-dia-semana" :title="`Día ${dia}`">
                  {{ getDiaSemanaBrev(dia) }}
                </th>
                <th rowspan="2" class="col-total">Total</th>
              </tr>
              <tr class="header-row">
                <th v-for="dia in daysInMonth" :key="'num-' + dia" class="col-dia" :title="`Día ${dia}`">
                  {{ dia }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trabajador in responsable.trabajadores" :key="trabajador.trabajadorId" class="data-row">
                <td class="col-nombre">
                  <strong>{{ trabajador.nombre }}</strong>
                </td>
                <td class="col-ruc">{{ trabajador.ruc || '-' }}</td>
                <td class="col-cargo">{{ trabajador.cargo || '-' }}</td>
                <td v-for="dia in daysInMonth" :key="dia" class="col-dia horas">
                  {{ trabajador.horasPorDia[dia] || '-' }}
                </td>
                <td class="col-total total-horas">
                  <strong>{{ trabajador.totalHoras.toFixed(1) }}</strong>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="footer-row">
                <td colspan="3" class="col-label">
                  <strong>Total Horas por Día</strong>
                </td>
                <td v-for="dia in daysInMonth" :key="dia" class="col-dia total-dia">
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

// Obtener inicial del día de la semana
const getDiaSemanaBrev = (dia: number): string => {
  const monthMap: Record<string, number> = {
    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
  }
  const monthNum = monthMap[mesSeleccionado.value] || 1
  const date = new Date(parseInt(yearSeleccionado.value), monthNum - 1, dia)
  const dayOfWeek = date.getDay()
  const diasBrev = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  return diasBrev[dayOfWeek]
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

    // Llamar al endpoint del backend para generar el PDF
    const response = await fetch(
      `/api/reporte/consolidado-por-responsable/pdf?year=${yearSeleccionado.value}&mes=${mesSeleccionado.value}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Error al descargar PDF: ${response.statusText}`)
    }

    // Obtener el blob del PDF
    const blob = await response.blob()

    // Crear un link temporal para descargar
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

    // Llamar al endpoint del backend para generar el PDF completo
    const response = await fetch(
      `/api/reporte/consolidado-por-responsable/pdf?year=${yearSeleccionado.value}&mes=${mesSeleccionado.value}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Error al descargar PDF: ${response.statusText}`)
    }

    // Obtener el blob del PDF
    const blob = await response.blob()

    // Crear un link temporal para descargar
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
  background: #f5f7fa;
  min-height: 100vh;
}

.header-section {
  margin-bottom: 30px;
}

.header-section h2 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 1.8em;
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.95em;
}

/* Filtros */
.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9em;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  background: white;
  cursor: pointer;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-consultar,
.btn-pdf {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9em;
}

.btn-consultar {
  background-color: #3498db;
  color: white;
}

.btn-consultar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-pdf {
  background-color: #27ae60;
  color: white;
}

.btn-pdf:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-consultar:disabled,
.btn-pdf:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
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
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.period {
  font-size: 1.1em;
  font-weight: 600;
  color: #2c3e50;
}

.total {
  font-size: 0.9em;
  color: #7f8c8d;
}

/* Responsable Section */
.responsable-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.responsable-header {
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.responsable-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.responsable-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.badge {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
}

.btn-pdf-responsable {
  padding: 8px 16px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-pdf-responsable:hover:not(:disabled) {
  background-color: #219a52;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(39, 174, 96, 0.3);
}

.btn-pdf-responsable:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Tabla */
.table-wrapper {
  overflow-x: auto;
}

.consolidado-table {
  width: 100%;
  border-collapse: collapse;
}

.consolidado-table thead {
  background-color: #34495e;
  color: white;
  position: sticky;
  top: 0;
}

.consolidado-table th {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85em;
  white-space: nowrap;
}

.col-nombre {
  text-align: left;
  min-width: 150px;
}

.col-ruc,
.col-cargo {
  min-width: 80px;
}

.col-dia {
  width: 35px;
}

.header-dia-semana {
  text-align: center;
  padding: 4px 2px !important;
  font-weight: 600;
  font-size: 0.85em;
}

.col-total {
  min-width: 60px;
}

.consolidado-table td {
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #ecf0f1;
  font-size: 0.9em;
}

.consolidado-table tbody tr:hover {
  background-color: #f8f9fa;
}

.consolidado-table .data-row .col-nombre {
  text-align: left;
  color: #2c3e50;
}

.consolidado-table .horas {
  font-size: 0.85em;
  color: #555;
}

.consolidado-table .total-horas {
  background-color: #e8f5e9;
  font-weight: 600;
  color: #27ae60;
}

/* Footer */
.consolidado-table tfoot {
  background-color: #f0f0f0;
  font-weight: 600;
}

.consolidado-table .footer-row td {
  background-color: #f0f0f0;
  border-top: 2px solid #bbb;
  border-bottom: none;
  font-weight: 600;
  padding: 10px;
}

.consolidado-table .col-label {
  text-align: left;
}

.consolidado-table .total-dia {
  background-color: #fff9e6;
  color: #f39c12;
}

.consolidado-table .total-general {
  background-color: #e8f5e9;
  color: #27ae60;
}

/* Sin datos */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 20px;
}

.no-data p {
  margin: 10px 0;
  font-size: 1.1em;
}

.hint {
  font-size: 0.95em;
  color: #95a5a6;
  margin-top: 10px !important;
}

/* Firma Section */
.firma-section {
  padding: 30px 20px;
  background: white;
  margin-top: -2px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
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
  background-color: #333;
  margin-bottom: 10px;
  min-height: 60px;
  border-bottom: 2px solid #333;
}

.firma-label,
.nombre-label,
.fecha-label {
  margin: 5px 0 0 0;
  font-size: 0.85em;
  color: #555;
  font-weight: 600;
}

.nombre-label {
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
  min-width: 150px;
}

.fecha-label {
  font-size: 0.9em;
  color: #666;
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
