<template>
  <div class="reporte-grafico">
    <div class="header">
      <h1>Grafico de Movimientos</h1>
      <router-link to="/reportes-consolidados" class="btn-back">← Volver</router-link>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Fecha Inicio:</label>
        <input type="date" v-model="filtros.fechaInicio" />
      </div>
      <div class="filter-group">
        <label>Fecha Fin:</label>
        <input type="date" v-model="filtros.fechaFin" />
      </div>
      <div class="filter-group">
        <label>Finca:</label>
        <select v-model="filtros.fincaId">
          <option value="">Todas</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Producto:</label>
        <select v-model="filtros.productoId">
          <option value="">Todos</option>
          <option v-for="producto in productos" :key="producto.id" :value="producto.id">
            {{ producto.code }} - {{ producto.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Granularidad:</label>
        <select v-model="filtros.granularidad">
          <option value="DIA">Diario</option>
          <option value="SEMANA">Semanal</option>
          <option value="MES">Mensual</option>
        </select>
      </div>
      <button class="btn-generar" @click="generarReporte" :disabled="loading">
        {{ loading ? 'Generando...' : '🔍 Generar' }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="reporte" class="summary-cards">
      <div class="card entradas">
        <div class="value">{{ reporte.totales.totalEntradas }}</div>
        <div class="label">Total Entradas</div>
      </div>
      <div class="card salidas">
        <div class="value">{{ reporte.totales.totalSalidas }}</div>
        <div class="label">Total Salidas</div>
      </div>
      <div class="card highlight">
        <div class="value">{{ reporte.totales.balance }}</div>
        <div class="label">Balance</div>
      </div>
      <div class="card">
        <div class="value">{{ reporte.totales.periodos }}</div>
        <div class="label">Periodos</div>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="reporte && reporte.series.length > 0" class="section">
      <h2>Entradas vs Salidas</h2>
      <div class="chart-container">
        <div class="chart">
          <div class="chart-bars">
            <div
              v-for="(item, index) in reporte.series"
              :key="index"
              class="bar-group"
            >
              <div class="bars">
                <div
                  class="bar entrada"
                  :style="{ height: getBarHeight(item.entradas) + 'px' }"
                  :title="'Entradas: ' + item.entradas"
                >
                  <span v-if="item.entradas > 0" class="bar-value">{{ item.entradas }}</span>
                </div>
                <div
                  class="bar salida"
                  :style="{ height: getBarHeight(item.salidas) + 'px' }"
                  :title="'Salidas: ' + item.salidas"
                >
                  <span v-if="item.salidas > 0" class="bar-value">{{ item.salidas }}</span>
                </div>
              </div>
              <div class="bar-label">{{ item.etiqueta }}</div>
            </div>
          </div>
        </div>
        <div class="legend">
          <span class="legend-item entrada">■ Entradas</span>
          <span class="legend-item salida">■ Salidas</span>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div v-if="reporte && reporte.series.length > 0" class="section">
      <h2>Detalle por Periodo</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Periodo</th>
            <th>Entradas</th>
            <th>Salidas</th>
            <th>Balance</th>
            <th>Tendencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in reporte.series" :key="index">
            <td>{{ item.etiqueta }}</td>
            <td class="entrada">+{{ item.entradas }}</td>
            <td class="salida">-{{ item.salidas }}</td>
            <td :class="{ 'positivo': item.balance > 0, 'negativo': item.balance < 0 }">
              {{ item.balance > 0 ? '+' : '' }}{{ item.balance }}
            </td>
            <td>
              <span v-if="item.balance > 0" class="trend up">↑</span>
              <span v-else-if="item.balance < 0" class="trend down">↓</span>
              <span v-else class="trend neutral">→</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th class="entrada">+{{ reporte.totales.totalEntradas }}</th>
            <th class="salida">-{{ reporte.totales.totalSalidas }}</th>
            <th :class="{ 'positivo': reporte.totales.balance > 0, 'negativo': reporte.totales.balance < 0 }">
              {{ reporte.totales.balance > 0 ? '+' : '' }}{{ reporte.totales.balance }}
            </th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-if="reporte && reporte.series.length === 0" class="empty-state">
      No hay movimientos para el periodo seleccionado.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import ReportesService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import ProductoService from '@/services/ProductoService'
import type { ReporteMovimientosGrafico, Granularidad } from '@/types/Reportes'
import type { Finca } from '@/types/Finca'
import type { Producto } from '@/types/Producto'

const loading = ref(false)
const reporte = ref<ReporteMovimientosGrafico | null>(null)
const fincas = ref<Finca[]>([])
const productos = ref<Producto[]>([])

const getDefaultDates = () => {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  return {
    inicio: threeMonthsAgo.toISOString().split('T')[0],
    fin: now.toISOString().split('T')[0]
  }
}

const defaultDates = getDefaultDates()

const filtros = reactive({
  fechaInicio: defaultDates.inicio,
  fechaFin: defaultDates.fin,
  fincaId: '',
  productoId: '',
  granularidad: 'SEMANA' as Granularidad
})

const maxValue = computed(() => {
  if (!reporte.value) return 100
  const values = reporte.value.series.flatMap(s => [s.entradas, s.salidas])
  return Math.max(...values, 1)
})

const getBarHeight = (value: number): number => {
  const maxHeight = 200
  return Math.max((value / maxValue.value) * maxHeight, value > 0 ? 20 : 0)
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.getAll()
    fincas.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
  }
}

const cargarProductos = async () => {
  try {
    const response = await ProductoService.getAll()
    productos.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading productos:', error)
  }
}

const generarReporte = async () => {
  if (!filtros.fechaInicio || !filtros.fechaFin) {
    alert('Seleccione las fechas de inicio y fin')
    return
  }

  loading.value = true
  try {
    const params = {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      fincaId: filtros.fincaId || undefined,
      productoId: filtros.productoId || undefined,
      granularidad: filtros.granularidad
    }
    const response = await ReportesService.getMovimientosGrafico(params)
    reporte.value = response.data
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Error al generar el reporte')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarFincas()
  cargarProductos()
  generarReporte()
})
</script>

<style scoped>
.reporte-grafico {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.btn-back {
  color: #3498db;
  text-decoration: none;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.85rem;
  color: #666;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.btn-generar {
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-generar:hover {
  background: #229954;
}

.btn-generar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.card.highlight {
  background: #27ae60;
  color: white;
}

.card.entradas {
  border-left: 4px solid #27ae60;
}

.card.salidas {
  border-left: 4px solid #e74c3c;
}

.card .value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.card .label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.chart-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart {
  overflow-x: auto;
}

.chart-bars {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  min-height: 250px;
  padding-bottom: 30px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.bars {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 200px;
}

.bar {
  width: 30px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 0;
  transition: height 0.3s ease;
}

.bar.entrada {
  background: #27ae60;
}

.bar.salida {
  background: #e74c3c;
}

.bar-value {
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding-top: 4px;
}

.bar-label {
  margin-top: 10px;
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.legend-item {
  font-size: 0.9rem;
}

.legend-item.entrada {
  color: #27ae60;
}

.legend-item.salida {
  color: #e74c3c;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.data-table tfoot th {
  background: #f0f0f0;
  font-weight: bold;
}

.entrada {
  color: #27ae60;
  font-weight: bold;
}

.salida {
  color: #e74c3c;
  font-weight: bold;
}

.positivo {
  color: #27ae60;
  font-weight: bold;
}

.negativo {
  color: #e74c3c;
  font-weight: bold;
}

.trend {
  font-size: 1.2rem;
  font-weight: bold;
}

.trend.up {
  color: #27ae60;
}

.trend.down {
  color: #e74c3c;
}

.trend.neutral {
  color: #95a5a6;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
