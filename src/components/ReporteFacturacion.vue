<template>
  <div class="reporte-facturacion">
    <div class="header">
      <h1>Reporte de Facturación</h1>
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
        <label>Tipo:</label>
        <select v-model="filtros.tipo">
          <option value="">Todos</option>
          <option value="VALE">Vales</option>
          <option value="FACTURA">Facturas</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Agrupar por:</label>
        <select v-model="filtros.agruparPor">
          <option value="FINCA">Finca</option>
          <option value="TIPO">Tipo</option>
          <option value="DESTINO">Destino</option>
        </select>
      </div>
      <button class="btn-generar" @click="generarReporte" :disabled="loading">
        {{ loading ? 'Generando...' : '🔍 Generar' }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="reporte" class="summary-cards">
      <div class="card">
        <div class="value">{{ reporte.resumen.totalDocumentos }}</div>
        <div class="label">Documentos</div>
      </div>
      <div class="card vales">
        <div class="value">{{ reporte.resumen.totalVales }}</div>
        <div class="label">Vales</div>
      </div>
      <div class="card facturas">
        <div class="value">{{ reporte.resumen.totalFacturas }}</div>
        <div class="label">Facturas</div>
      </div>
      <div class="card highlight">
        <div class="value">${{ formatNumber(reporte.resumen.valorTotal) }}</div>
        <div class="label">Valor Total</div>
      </div>
    </div>

    <!-- Detail by Group -->
    <div v-if="reporte && reporte.detalle.length > 0" class="section">
      <h2>Detalle por {{ filtros.agruparPor }}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ filtros.agruparPor }}</th>
            <th>Documentos</th>
            <th>Cantidad</th>
            <th>Valor</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in reporte.detalle" :key="index">
            <td>{{ item.finca || item.tipo || item.destino || 'N/A' }}</td>
            <td>{{ item.documentos }}</td>
            <td>{{ item.cantidad }}</td>
            <td class="monto">${{ formatNumber(item.valor) }}</td>
            <td>
              <div class="progress-bar">
                <div class="progress" :style="{ width: item.porcentaje + '%' }"></div>
                <span>{{ item.porcentaje }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Documents List -->
    <div v-if="reporte && reporte.documentos.length > 0" class="section">
      <h2>Documentos ({{ reporte.documentos.length }})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Destino</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in reporte.documentos" :key="doc.id">
            <td>{{ doc.numero }}</td>
            <td>{{ formatDate(doc.fecha) }}</td>
            <td>{{ doc.producto }}</td>
            <td>{{ doc.cantidad }}</td>
            <td>{{ doc.destino }}</td>
            <td class="monto">${{ formatNumber(doc.valor) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="reporte && reporte.documentos.length === 0" class="empty-state">
      No hay documentos para el período seleccionado.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ReportesService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import type { ReporteFacturacion, TipoSalida } from '@/types/Reportes'
import type { Finca } from '@/types/Finca'

const loading = ref(false)
const reporte = ref<ReporteFacturacion | null>(null)
const fincas = ref<Finca[]>([])

const getDefaultDates = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    inicio: firstDay.toISOString().split('T')[0],
    fin: lastDay.toISOString().split('T')[0]
  }
}

const defaultDates = getDefaultDates()

const filtros = reactive({
  fechaInicio: defaultDates.inicio,
  fechaFin: defaultDates.fin,
  fincaId: '',
  tipo: '' as TipoSalida | '',
  agruparPor: 'FINCA' as 'FINCA' | 'TIPO' | 'DESTINO'
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
      tipo: filtros.tipo || undefined,
      agruparPor: filtros.agruparPor
    }
    const response = await ReportesService.getFacturacion(params)
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
.reporte-facturacion {
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
  background: #3498db;
  color: white;
}

.card.vales {
  border-left: 4px solid #27ae60;
}

.card.facturas {
  border-left: 4px solid #9b59b6;
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
  color: #27ae60;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar .progress {
  height: 8px;
  background: #3498db;
  border-radius: 4px;
  min-width: 10px;
}

.progress-bar span {
  font-size: 0.85rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
