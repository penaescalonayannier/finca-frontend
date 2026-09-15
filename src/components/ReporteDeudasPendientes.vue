<template>
  <div class="reporte-deudas">
    <div class="header">
      <h1>Deudas Pendientes</h1>
      <router-link to="/reportes-consolidados" class="btn-back">← Volver</router-link>
    </div>

    <!-- Filters -->
    <div class="filters">
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
        <label>Monto mínimo:</label>
        <input type="number" v-model.number="filtros.montoMinimo" placeholder="0" />
      </div>
      <div class="filter-group">
        <label>Monto máximo:</label>
        <input type="number" v-model.number="filtros.montoMaximo" placeholder="Sin límite" />
      </div>
      <div class="filter-group checkbox">
        <label>
          <input type="checkbox" v-model="filtros.incluirHistorial" />
          Incluir último pago
        </label>
      </div>
      <button class="btn-generar" @click="generarReporte" :disabled="loading">
        {{ loading ? 'Generando...' : '🔍 Generar' }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="reporte" class="summary-cards">
      <div class="card">
        <div class="value">{{ reporte.resumen.trabajadoresConDeuda }}</div>
        <div class="label">Con Deuda</div>
      </div>
      <div class="card highlight">
        <div class="value">${{ formatNumber(reporte.resumen.montoTotalDeuda) }}</div>
        <div class="label">Total Deuda</div>
      </div>
      <div class="card">
        <div class="value">${{ formatNumber(reporte.resumen.promedioDeuda) }}</div>
        <div class="label">Promedio</div>
      </div>
      <div class="card">
        <div class="value">${{ formatNumber(reporte.resumen.deudaMaxima) }}</div>
        <div class="label">Máxima</div>
      </div>
    </div>

    <!-- By Finca Table -->
    <div v-if="reporte && reporte.porFinca.length > 0" class="section">
      <h2>Deuda por Finca</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Finca</th>
            <th>Trabajadores</th>
            <th>Monto Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reporte.porFinca" :key="item.fincaId">
            <td>{{ item.fincaName }}</td>
            <td>{{ item.trabajadoresConDeuda }}</td>
            <td class="monto">${{ formatNumber(item.montoTotal) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Deudas Detail Table -->
    <div v-if="reporte && reporte.deudas.length > 0" class="section">
      <h2>Lista de Deudores</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Trabajador</th>
            <th>RUC</th>
            <th>Finca</th>
            <th>Deuda</th>
            <th v-if="filtros.incluirHistorial">Último Pago</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(deuda, index) in reporte.deudas" :key="deuda.trabajadorId">
            <td>{{ index + 1 }}</td>
            <td>{{ deuda.trabajadorNombre }}</td>
            <td>{{ deuda.trabajadorRuc }}</td>
            <td>{{ deuda.fincaName }}</td>
            <td class="monto">${{ formatNumber(deuda.monto) }}</td>
            <td v-if="filtros.incluirHistorial">
              <span v-if="deuda.ultimoPagoFecha">
                {{ formatDate(deuda.ultimoPagoFecha) }} - ${{ formatNumber(deuda.ultimoPagoMonto || 0) }}
              </span>
              <span v-else class="no-data">Sin pagos</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="reporte && reporte.deudas.length === 0" class="empty-state">
      No hay trabajadores con deuda según los filtros seleccionados.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ReportesService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import type { ReporteDeudasPendientes } from '@/types/Reportes'
import type { Finca } from '@/types/Finca'

const loading = ref(false)
const reporte = ref<ReporteDeudasPendientes | null>(null)
const fincas = ref<Finca[]>([])

const filtros = reactive({
  fincaId: '',
  montoMinimo: undefined as number | undefined,
  montoMaximo: undefined as number | undefined,
  incluirHistorial: false
})

const formatNumber = (num: number): string => {
  return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('es-ES')
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.getAll()
    fincas.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
  }
}

const generarReporte = async () => {
  loading.value = true
  try {
    const params = {
      fincaId: filtros.fincaId || undefined,
      montoMinimo: filtros.montoMinimo,
      montoMaximo: filtros.montoMaximo,
      incluirHistorial: filtros.incluirHistorial
    }
    const response = await ReportesService.getDeudasPendientes(params)
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
  generarReporte()
})
</script>

<style scoped>
.reporte-deudas {
  padding: 20px;
  max-width: 1200px;
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

.filter-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.filter-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.btn-generar {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-generar:hover {
  background: #2980b9;
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
  background: #e74c3c;
  color: white;
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
  margin-bottom: 15px;
  font-size: 1.2rem;
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

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.data-table .monto {
  font-weight: bold;
  color: #e74c3c;
}

.no-data {
  color: #999;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
